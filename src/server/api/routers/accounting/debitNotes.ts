import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter } from "~/utils/localNumberStrings";

export const debitNotesRouter = createTRPCRouter({
    getLCScForDebitNotes: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                const isTT = terms.name.toLowerCase() === 'tt';

                let lcScList: { id: string; sc_lc_no: string }[];

                if (isTT) {
                    lcScList = await ctx.db.$queryRaw<{ id: string; sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            SC.ID AS SC_ID,
                            SC.sales_contract_no AS sc_lc_no
                        FROM sales_contracts AS SC 
                            INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            INNER JOIN order_styles AS SO ON SO.order_id = SCD.order_id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = SO.id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FID.factory_invoice_id
                        WHERE FSD.FACTORY_RATE <> COALESCE(FSD.TRANSFER_RATE, 0)
                            AND NOT EXISTS (
                                SELECT 1
                                FROM debit_note_details AS DND
                                WHERE DND.factory_shipment_id = FSD.ID
                            )
                            AND SC.buyer_id = ${input.buyer_id}
                            AND EXISTS ( -- Admin
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS ( -- Team Member
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = SC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            );
                        `;
                }
                else {
                    lcScList = await ctx.db.$queryRaw<{ id: string; sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            LC.ID AS LC_ID,
                            LC.LC_NO AS sc_lc_no
                        FROM LC_MASTER AS LC
                            INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = LS.shipment_details_id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FID.factory_invoice_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                        WHERE FSD.FACTORY_RATE <> COALESCE(FSD.TRANSFER_RATE, 0)
                            AND NOT EXISTS (
                                SELECT 1
                                FROM debit_note_details AS DND
                                WHERE DND.factory_shipment_id = FSD.ID
                            )
                            AND LC.buyer_id = ${input.buyer_id}
                            AND EXISTS ( -- Admin
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS ( -- Team Member
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = LC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            );
                    `;
                }

                return lcScList;
            }
            catch (error) {
                handlePrismaError(error);
            }
        })
})