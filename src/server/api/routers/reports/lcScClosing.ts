import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import type { LcScClosingHeader } from "./_types/lcScClosing";
import { safeNumber } from "~/utils/numbers";


export const lcScClosingRouter = createTRPCRouter({
    getLCs: protectedProcedure
        .input(z.object({
            base: z.enum(['LC', 'SC']),
            buyerId: z.number().optional()
        }))
        .query(async ({ctx, input}) => {
            try {
                const can_view = ctx.permissions[m.LC_SC_CLOSING]?.can_view;

                if(!can_view) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view LC/SC Closing Report'
                    })
                }

                let scLcList: { id: string, sc_lc_no: string}[] = [];

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
                    INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                    INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                    INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                    INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                    INNER JOIN buyers AS B ON B.id = LC.buyer_id
                WHERE LC.ID = {input.lcScId}
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

            return { header }
        }),
})