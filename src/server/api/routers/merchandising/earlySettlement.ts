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
                        ES.id,
                        BO.REF_NO,
                        B.BUYER_NAME
                    FROM early_settlement AS ES
                        INNER JOIN buyer_orders AS BO ON BO.id = ES.order_id
                        INNER JOIN buyers AS B ON BO.buyer_id = B.id
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
                
            const earlySettlements = results.map(({total_count: _, ...earlySettlements}) => earlySettlements );

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
                        ES.id,
                        BO.REF_NO,
                        B.BUYER_NAME
                    FROM early_settlement AS ES
                        INNER JOIN buyer_orders AS BO ON BO.id = ES.order_id
                        INNER JOIN buyers AS B ON BO.buyer_id = B.id
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
                
            const earlySettlements = results.map(({total_count: _, ...earlySettlements}) => earlySettlements );

            return { earlySettlements, total };
        }),

    deleteEarlySettlement: protectedProcedure
        .input(z.object({
            id: z.string().min(1, 'Id is mandatory')
        }))
        .mutation(async ({ctx, input}) => {
            const can_delete = ctx.permissions[m.EARLY_SETTLEMENT]?.can_delete;

            if(!can_delete){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to delete early settlement"
                })
            }
            
            try {
                return ctx.db.$transaction(async (tx) => {
                    const earlySettlementDetails = await ctx.db.early_settlement_details.findMany({
                        where: {
                            early_settlement_id: input.id
                        }
                    })

                    await Promise.all([
                        await ctx.db.early_settlement_details.deleteMany({
                            where: {
                                early_settlement_id: input.id
                            }
                        }),
                        
                        await ctx.db.early_settlement.delete({
                            where: {
                                id: input.id
                            }
                        }),
                        
                        await ctx.db.early_settlement_details_history.createMany({
                            data: earlySettlementDetails.map((settlements) => ({
                                early_settlement_details_id: settlements.id,
                                shipment_details_id: settlements.early_settlement_id,
                                early_settlement_charge: settlements.early_settlement_charge,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }))
                        })
                    ]);
                })
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getPoDetails: protectedProcedure
        .input(z.object({
            id: z.string().min(1, 'Id is required')
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlements"
                })
            }
            
            const shipments = await ctx.db.$executeRaw`
                WITH BASE AS (
                    SELECT
                        OS.style,
                        SD.id AS shipment_detail_id,
                        SD.buyer_po,
                        D.name AS destination,
                        BDS.size,
                        SUM(SID.quantity) AS order_quantity,
                        SD.fob_rate,
                        ESD.early_settlement_charge,
                        SD.fob_rate * (1 - ESD.early_settlement_charge / 100) AS effective_rdl_fob,
                        FSD.factory_rate,
                        COALESCE(CDD.dhaka_commission_percentage, 0) AS dhaka_percentage,
                        COALESCE(CDD.others_commission_percentage, 0) AS others_percentage,
                        COALESCE(CDD.overseas_commission_percentage, 0) AS overseas_percentage
                    FROM early_settlement_details AS ESD
                    INNER JOIN shipment_details AS SD ON SD.id = ESD.shipment_details_id
                    INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                    INNER JOIN commission_distributions_details AS CDD ON CDD.shipment_details_id = SD.id
                    INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                    INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                    INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                    INNER JOIN buyer_department_sizes AS BDS ON BDS.id = SD.size_id
                    INNER JOIN destinations AS D ON D.id = SD.destination_id
                    WHERE ESD.early_settlement_id = ${input.id}
                    GROUP BY OS.id, SD.id, D.id, BDS.id, ESD.id, FSD.id, CDD.id
                ),
                CALC AS (
                    SELECT
                        *,
                        order_quantity * fob_rate AS rdl_value,
                        order_quantity * effective_rdl_fob AS effective_rdl_value,
                        order_quantity * factory_rate AS factory_value,
                        order_quantity * (effective_rdl_fob - factory_rate) AS commission,
                        dhaka_percentage + others_percentage + overseas_percentage AS total_percentage
                    FROM BASE
                )
                SELECT
                    style,
                    buyer_po,
                    destination,
                    size,
                    order_quantity,
                    fob_rate,
                    rdl_value,
                    early_settlement_charge,
                    effective_rdl_fob,
                    effective_rdl_value,
                    factory_rate,
                    factory_value,
                    commission,
                    commission * dhaka_percentage / NULLIF(total_percentage, 0) AS dhaka_commission,
                    commission * others_percentage / NULLIF(total_percentage, 0) AS other_commission,
                    commission * overseas_percentage / NULLIF(total_percentage, 0) AS overseas_commission
                FROM CALC;
            `
        })
});

