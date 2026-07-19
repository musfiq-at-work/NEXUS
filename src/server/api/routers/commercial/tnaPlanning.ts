import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, ETD_DATE_DB_ID } from "~/utils/config";

export const tnaPlanRouter = createTRPCRouter({
    createTNAPlan: protectedProcedure
        .input(
            z.object({
                template_id: z.string(),
                style_id: z.string(),
                plan_date: z.date(),
                order_id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_create = ctx.permissions[m.TNA_PLANNING]?.can_add;

            if (!can_create) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to create TNA Plans." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newPlan = await tx.tna_plans.create({
                        data: {
                            tna_template_id: input.template_id,
                            style_id: input.style_id,
                            plan_date: input.plan_date,
                            order_id: input.order_id,
                        },
                    });

                    await tx.tna_plan_history.create({
                        data: {
                            tna_plan_id: newPlan.id,
                            tna_template_id: input.template_id,
                            style_id: input.style_id,
                            plan_date: input.plan_date,
                            order_id: input.order_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        }
                    });

                    // Populate TNA_PLAN_DETAILS based on the template actions and shipment details
                    await tx.$queryRaw`
                        INSERT INTO TNA_PLAN_DETAILS (
                            TNA_PLAN_ID,
                            TNA_TEMPLATE_ACTION_ID,
                            SHIPMENT_ID
                        )
                        SELECT 
                            TP.ID,
                            TTA.ID,
                            SD.ID
                        FROM TNA_PLANS AS TP
                            INNER JOIN ORDER_STYLES AS OS ON OS.ID = TP.STYLE_ID
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ORDER_STYLE_ID = OS.ID
                            INNER JOIN TNA_TEMPLATES AS TT ON TT.ID = TP.TNA_TEMPLATE_ID
                            INNER JOIN TNA_TEMPLATE_ACTIONS AS TTA ON TTA.TNA_TEMPLATE_ID = TP.TNA_TEMPLATE_ID
                            INNER JOIN TNA_ACTIONS AS TA ON TA.ID = TTA.TNA_ACTION_ID
                        WHERE TP.ID = ${newPlan.id};
                    `;

                    return newPlan;
                }, {timeout: 30000})
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
})

/**
    SELECT
        *
    FROM commercial_tna_templates AS CTP
    WHERE CTP.payment_term_id IN (
        SELECT
            SD.payment_term_id
        FROM FACTORY_INVOICE AS FI
        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
        INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
    );
 */