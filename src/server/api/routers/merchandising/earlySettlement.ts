import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma, shipment_modes } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { EarlySettlements } from "./_types/earlySettlement";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { safeNumber } from "~/utils/numbers";

export const earlySettlementRouter = createTRPCRouter({
    getEarlySettlements: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlements"
                })
            }

            const results = await ctx.db.$queryRaw<EarlySettlements[]>`
                WITH EARLY_SETTLEMENTS AS (
                    SELECT
                        BO.REF_NO,
                        B.BUYER_NAME,
                        SUM(SID.QUANTITY * SD.FOB_RATE * ESD.EARLY_SETTLEMENT_CHARGE / 100) AS CHARGE,
                        CU.SYMBOL
                    FROM early_settlement AS ES
                        INNER JOIN buyer_orders AS BO ON BO.id = ES.order_id
                        INNER JOIN buyers AS B ON BO.buyer_id = B.id
                        INNER JOIN early_settlement_details AS ESD ON ESD.EARLY_SETTLEMENT_ID = ES.id
                        INNER JOIN shipment_details AS SD ON SD.id = ESD.shipment_details_id
                        INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                        LEFT JOIN currencies AS CU ON CU.id = BO.secondary_currency_id
                    WHERE (
                        EXISTS ( -- Admin
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
                            WHERE T.BUYER_ID = B.id
                                AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    GROUP BY ES.ID, B.ID, BO.ID, CU.id
                    ORDER BY ES.added_at DESC
                )
                SELECT
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM EARLY_SETTLEMENTS
                LIMIT ${input.limit}
                OFFSET ${input.offset};
            `;

            const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                
            const earlySettlements = results.map(({total_count: _, ...earlySettlements}) => {
                return {
                    ...earlySettlements,
                    charge: earlySettlements.charge === '-' ? '-' 
                        : currencyFormatter(safeNumber(earlySettlements.charge), earlySettlements.symbol ?? '$')
                }
            });

            return { earlySettlements, total };
        }),

    searchEarlySettlements: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlements"
                })
            }

            const results = await ctx.db.$queryRaw<EarlySettlements[]>`
                WITH EARLY_SETTLEMENTS AS (
                    SELECT
                        BO.REF_NO,
                        B.BUYER_NAME,
                        SUM(SID.QUANTITY * SD.FOB_RATE * ESD.EARLY_SETTLEMENT_CHARGE / 100) AS CHARGE,
                        CU.SYMBOL
                    FROM early_settlement AS ES
                        INNER JOIN buyer_orders AS BO ON BO.id = ES.order_id
                        INNER JOIN buyers AS B ON BO.buyer_id = B.id
                        INNER JOIN early_settlement_details AS ESD ON ESD.EARLY_SETTLEMENT_ID = ES.id
                        INNER JOIN shipment_details AS SD ON SD.id = ESD.shipment_details_id
                        INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                        LEFT JOIN currencies AS CU ON CU.id = BO.secondary_currency_id
                    WHERE (
                        EXISTS ( -- Admin
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
                            WHERE T.BUYER_ID = B.id
                                AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    AND (
                        BO.REF_NO ILIKE '%' || ${input.query} || '%'
                        OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                    )
                    GROUP BY ES.ID, B.ID, BO.ID, CU.id
                    ORDER BY ES.added_at DESC
                )
                SELECT
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM EARLY_SETTLEMENTS
                LIMIT ${input.limit}
                OFFSET ${input.offset};
            `;

            const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                
            const earlySettlements = results.map(({total_count: _, ...earlySettlements}) => {
                return {
                    ...earlySettlements,
                    charge: earlySettlements.charge === '-' ? '-' 
                        : currencyFormatter(safeNumber(earlySettlements.charge), earlySettlements.symbol ?? '$')
                }
            });

            return { earlySettlements, total };
        })
});