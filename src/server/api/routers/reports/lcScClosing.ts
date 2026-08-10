import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import type { LcScClosingHeader, LcScTableData } from "./_types/lcScClosing";
import { safeNumber } from "~/utils/numbers";

export const lcScClosingRouter = createTRPCRouter({
    getLCs: protectedProcedure
        .input(z.object({
            base: z.enum(['LC', 'SC']),
            buyerId: z.number().optional()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LC_SC_CLOSING]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view LC/SC Closing Report'
                })
            }

            try {
                let scLcList: { id: string, sc_lc_no: string}[];

                if(input.base === 'LC'){
                    scLcList = await ctx.db.lc_master.findMany({
                        where: {
                            buyer_id:  input.buyerId
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
                            buyer_id: input.buyerId
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
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
    
    getPDFData: protectedProcedure
        .input(z.object({
            lcScId: z.string()
        }))
        .query( async ({ctx, input}) => {
            const headerData = await ctx.db.$queryRaw<LcScClosingHeader[]>`
                SELECT	
                    LC.lc_no,
                    B.buyer_name,
                    SUM(SID.quantity) AS order_quantity,
                    SUM(SID.quantity * SD.fob_rate / BO.currency_rate) AS value,
                    SUM(SID.quantity * SD.fob_rate) AS secondary_value,
                    C.symbol
                FROM lc_master AS LC
                    INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                    INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                    INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                    INNER JOIN buyer_orders AS BO ON BO.id = LO.order_id
                    INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                    INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                    INNER JOIN buyers AS B ON B.id = LC.buyer_id
                WHERE LC.ID = ${input.lcScId}
                GROUP BY LC.ID, B.ID;
            `;

            const header = headerData.length > 0 ? {
                lc_no: headerData[0]?.lc_no,
                buyer_name: headerData[0]?.buyer_name,
                quantity: quantityFormatter(safeNumber(headerData[0]?.order_quantity)),
                value: currencyFormatter(safeNumber(headerData[0]?.value), '$'),
                ...(headerData[0]?.symbol !== '$' && {
                    secondary_value: currencyFormatter(
                        safeNumber(headerData[0]?.secondary_value),
                        headerData[0]?.symbol ?? '$'
                    )
                })
            } : null;

            const tableData = await ctx.db.$queryRaw<LcScTableData[]>`
                WITH EXFACTORY AS (
                    SELECT
                        LO.lc_master_id AS E_LC_ID,
                        MIN(E.exfactory_date) AS MIN_EXFACTORY_DATE,
                        MAX(E.exfactory_date) AS MAX_EXFACTORY_DATE,
                        SUM(ES.delivery_quantity) AS EXPORT_INVOICE_QUANTITY,
                        SUM(ES.delivery_quantity * SD.fob_rate) AS RDL_EXPORT_VALUE,
                        SUM(ES.delivery_quantity * SD.fob_rate / BO.currency_rate) AS RDL_EXPORT_VALUE_USD,
                        SUM(CASE 
                            WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                THEN ES.delivery_quantity * FSD.transfer_rate / BO.currency_rate
                            ELSE ES.delivery_quantity * FSD.factory_rate / BO.currency_rate
                        END) AS FACTORY_EXPORT_VALUE,
                        C.symbol
                    FROM lc_orders AS LO
                    INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                    INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                    INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                    INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                    INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                    INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                    INNER JOIN buyer_orders AS BO ON BO.id = LO.order_id
                    INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                    GROUP BY LO.lc_master_id, C.ID
                ), 
                PROCEED AS (
                    SELECT
                        DS.lc_id AS DS_LC_ID,
                        SUM(PRD.realized_amount) AS REALIZED_AMOUNT
                    FROM document_submissions AS DS
                    INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                    INNER JOIN proceed_realization_details AS PRD ON PRD.realization_id = PR.id
                    GROUP BY DS.lc_id
                ),
                FACTORY_PAYMENTS AS (
                    SELECT
                        DS.lc_id AS DS_LC_ID,
                        SUM(FP.paid_amount) AS FACTORY_PAID_AMOUNT
                    FROM document_submissions AS DS  
                        INNER JOIN factory_payments AS FP ON DS.id = FP.document_submission_id
                    GROUP BY DS.lc_id
                )
                SELECT	
                    E.MIN_EXFACTORY_DATE,
                    E.MAX_EXFACTORY_DATE,
                    E.EXPORT_INVOICE_QUANTITY,
                    E.RDL_EXPORT_VALUE,
                    E.RDL_EXPORT_VALUE_USD,
                    E.FACTORY_EXPORT_VALUE,
                    E.symbol,
                    p.REALIZED_AMOUNT,
                    F.FACTORY_PAID_AMOUNT
                FROM lc_master AS LC
                    INNER JOIN EXFACTORY AS E ON E.E_LC_ID = LC.ID
                    INNER JOIN PROCEED AS P ON P.DS_LC_ID = LC.ID
                    INNER JOIN FACTORY_PAYMENTS AS F ON F.DS_LC_ID = LC.ID
                WHERE LC.ID = ${input.lcScId}
                GROUP BY LC.ID, 
                    E.MIN_EXFACTORY_DATE,
                    E.MAX_EXFACTORY_DATE,
                    E.EXPORT_INVOICE_QUANTITY,
                    E.RDL_EXPORT_VALUE,
                    E.RDL_EXPORT_VALUE_USD,
                    E.FACTORY_EXPORT_VALUE,
                    E.symbol,
                    p.REALIZED_AMOUNT,
                    F.FACTORY_PAID_AMOUNT;
            `;

            const table = tableData.length > 0 ? {
                lc_no: headerData[0]?.lc_no,
                buyer_name: headerData[0]?.buyer_name,
                quantity: quantityFormatter(safeNumber(headerData[0]?.order_quantity)),
                value: currencyFormatter(safeNumber(headerData[0]?.value), '$'),
                ...(headerData[0]?.symbol !== '$' && {
                    secondary_value: currencyFormatter(
                        safeNumber(headerData[0]?.secondary_value),
                        headerData[0]?.symbol ?? '$'
                    )
                })
            } : null;

            return { header }
        }),
})