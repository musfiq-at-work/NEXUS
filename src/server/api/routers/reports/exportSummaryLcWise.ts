import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { generateActivityReportExcel } from "../../../_utils/excel/commercial_activity_report_excel/generateActivityReport";
import { safeNumber } from "~/utils/numbers";

interface LCExportSummary {
    buyer_name: string;
    lc_no: string;
    total_order_value: string;
    latest_shipment_date: string;
    latest_exfactory_date: string;
    lc_expire_date: string;
    total_order_quantity: string;
    total_shipped_quantity: string;
    balance_quantity: string;
    total_ship_value: string;
    balance_value: string;
    proceed_amount: string;
    factory_fdd_value: string;
}

export const exportSummaryLcWiseRouter = createTRPCRouter({
    getExportSummaryLcWise: protectedProcedure
        .input(
            z.object({
                fromDate: z.string().optional(),
                toDate: z.string().optional(),
                buyerIds: z.array(z.number()).optional(),
                lcIds: z.array(z.number()).optional(),
            })
        )
        .query(async ({ctx, input}) => {
            try {
                const can_view = ctx.permissions[m.EXPORT_SUMMARY_LC_WISE]?.can_view;

                if(!can_view) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view LC Export summary report'
                    })
                }

                const dateFilter = (!!input.fromDate && !!input.toDate) 
                    ? Prisma.sql`LC.LC_EXPIRE_DATE BETWEEN ${input.fromDate} and ${input.toDate}`
                    : Prisma.empty;

                const buyerFilter = (input.buyerIds ?? []).length > 0
                    ? Prisma.sql`BO.buyer_id IN (${Prisma.join(input.buyerIds!)})`
                    : Prisma.empty;

                const and = (!!input.fromDate && !!input.toDate) && (input.buyerIds ?? []).length > 0
                    ? Prisma.sql`AND`
                    : Prisma.empty;

                const report = await ctx.db.$queryRaw<LCExportSummary[]>`
                    WITH ORDER_DETAILS AS (
                        SELECT
                            SD.ID AS SHIPMENT_ID,
                            SUM(SID.QUANTITY) AS QUANTITY,
                            SUM(SID.QUANTITY) * SD.FOB_RATE / BO.currency_rate AS RDL_VALUE
                        FROM shipment_details AS SD 
                            INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id	
                            INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                        GROUP BY SD.ID, BO.ID
                    ),
                    EXFACTORY_DETAILS AS (
                        SELECT 
                            SD.ID AS SHIPMENT_ID,
                            SUM(ES.delivery_quantity) AS TOTAL_SHIPPED_QUANTITY,
                            SUM(ES.delivery_quantity) * SD.FOB_RATE / BO.currency_rate AS EXPORT_VALUE,
                            MAX(E.EXFACTORY_DATE) AS LAST_SHIPMENT_DATE
                        FROM exfactory_shipments AS ES 
                            INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                            INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON EO.exfactory_id = E.id
                        GROUP BY SD.id, BO.ID
                    ),
                    FACTORY_FDD AS (
                        SELECT 
                            FI.LC_ID AS LC_ID,
                            SUM(FP.PAID_AMOUNT) AS FDD_VALUE
                        FROM factory_payments AS FP 
                            INNER JOIN factory_invoice AS FI ON FI.id = FP.factory_invoice_id
                        GROUP BY FI.LC_ID 
                    ),
                    PROCEED_VALUE AS (
                        SELECT
                            DS.lc_id,
                            SUM(PRD.REALIZED_AMOUNT / C.currency_rate) AS PROCEED_AMOUNT
                        FROM document_submissions AS DS 
                            INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                            INNER JOIN proceed_realization_details AS PRD ON PRD.realization_id = PR.id
                            INNER JOIN (
                                SELECT
                                    RID.rdl_invoice_id,
                                    AVG(BO.currency_rate) AS currency_rate
                                FROM rdl_invoice_details AS RID
                                    INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                                    INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                                    INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                                    INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                                GROUP BY RID.rdl_invoice_id
                            ) C ON C.rdl_invoice_id = PRD.rdl_invoice_id
                        GROUP BY DS.lc_id
                    )
                    SELECT 
                        B.buyer_name AS BUYER_NAME,
                        LC.LC_NO,
                        SUM(OD.RDL_VALUE) AS TOTAL_ORDER_VALUE,
                        TO_CHAR(LC.LATEST_SHIPMENT_DATE, 'DD mon YYYY') AS LATEST_SHIPMENT_DATE,
                        COALESCE(TO_CHAR(MAX(ED.LAST_SHIPMENT_DATE), 'DD mon YYYY'), '-') AS LATEST_EXFACTORY_DATE,
                        TO_CHAR(LC.LC_EXPIRE_DATE, 'DD mon YYYY') AS LC_EXPIRE_DATE,
                        SUM(OD.QUANTITY) AS TOTAL_ORDER_QUANTITY,
                        COALESCE(SUM(ED.TOTAL_SHIPPED_QUANTITY)::NUMERIC(18, 2)::TEXT, '-') AS TOTAL_SHIPPED_QUANTITY,
                        COALESCE((SUM(ED.TOTAL_SHIPPED_QUANTITY) - SUM(OD.QUANTITY))::TEXT, '-') AS BALANCE_QUANTITY,
                        COALESCE(SUM(ED.EXPORT_VALUE)::TEXT, '-') AS TOTAL_SHIP_VALUE,
                        COALESCE((SUM(OD.RDL_VALUE) - SUM(ED.EXPORT_VALUE))::NUMERIC(18, 2)::TEXT, '-') AS BALANCE_VALUE,
                        COALESCE(PV.PROCEED_AMOUNT::NUMERIC(18, 2)::TEXT, '-') AS PROCEED_AMOUNT,
                        COALESCE(FF.FDD_VALUE::NUMERIC(18, 2)::TEXT, '-') AS FACTORY_FDD_VALUE
                    FROM lc_master AS LC
                        INNER JOIN buyers AS B ON B.id = LC.buyer_id
                        INNER JOIN lc_orders AS LCO ON LCO.lc_master_id = LC.id
                        INNER JOIN lc_shipments AS LCS ON LCS.lc_order_id = LCO.id
                        INNER JOIN ORDER_DETAILS AS OD ON OD.SHIPMENT_ID = LCS.shipment_details_id
                        LEFT JOIN EXFACTORY_DETAILS AS ED ON ED.SHIPMENT_ID = LCS.shipment_details_id
                        LEFT JOIN FACTORY_FDD AS FF ON FF.LC_ID = LC.ID
                        LEFT JOIN PROCEED_VALUE AS PV ON PV.lc_id = LC.ID
                    WHERE ${dateFilter} 
                        ${and} ${buyerFilter}
                    GROUP BY B.ID, LC.ID, PV.PROCEED_AMOUNT, FF.FDD_VALUE;
                `;

                const total_order_value = report.reduce((sum, item) => sum + Number(item.total_order_value), 0);
                const total_order_quantity = report.reduce((sum, item) => sum + Number(item.total_order_quantity), 0);
                const total_shipped_quantity = report.reduce((sum, item) => sum + Number(item.total_shipped_quantity), 0);
                const balance_quantity = report.reduce((sum, item) => sum + Number(item.balance_quantity), 0);
                const total_ship_value = report.reduce((sum, item) => sum + Number(item.total_ship_value), 0);
                const balance_value = report.reduce((sum, item) => sum + Number(item.balance_value), 0);
                const proceed_amount = report.reduce((sum, item) => sum + Number(item.proceed_amount), 0);
                const factory_fdd_value = report.reduce((sum, item) => sum + Number(item.factory_fdd_value), 0);

                const totals = {
                    total_order_value,
                    total_order_quantity,
                    total_shipped_quantity,
                    balance_quantity,
                    total_ship_value,
                    balance_value,
                    proceed_amount,
                    factory_fdd_value
                }

                return {report, totals};
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getLCs: protectedProcedure
        .input(z.object({
            base: z.enum(['LC', 'SC']),
            buyerIds: z.array(z.number()).optional()
        }))
        .query(async ({ctx, input}) => {
            try {
                const can_view = ctx.permissions[m.EXPORT_SUMMARY_LC_WISE]?.can_view;

                if(!can_view) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view LC Export summary report'
                    })
                }

                let scLcList: { id: string, sc_lc_no: string}[] = [];

                if(input.base === 'LC'){
                    scLcList = await ctx.db.lc_master.findMany({
                        where: {
                            buyer_id: {
                                in: input.buyerIds
                            }
                        },
                        select: {
                            id: true,
                            lc_no: true
                        }
                    }).then(results => results.map(item => ({ id: item.id, sc_lc_no: item.lc_no })))
                }
                else {
                    scLcList = await ctx.db.sales_contracts.findMany({
                        where: {
                            buyer_id: {
                                in: input.buyerIds
                            }
                        },
                        select: {
                            id: true,
                            sales_contract_no: true
                        }
                    }).then(results => results.map(item => ({ id: item.id, sc_lc_no: item.sales_contract_no})))
                }

                return scLcList;
            }
            catch (error) {
                handlePrismaError(error);
            }
        })
})
