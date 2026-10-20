import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

export const orderChecklistRouter = createTRPCRouter({
    getOrdersForChecklist: protectedProcedure
        .input(z.object({
            buyerId: z.number()
        }))
        .query(async ({ctx, input}) => {
            return await ctx.db.buyer_orders.findMany({
                where: {
                    buyer_id: input.buyerId,
                    order_checklist: {
                        none: {},
                    },
                },
                select: {
                    id: true,
                    ref_no: true,
                },
            });
        }),


    getStyleForOrderChecklist: protectedProcedure
        .input(z.object({
            orderId: z.string()
        }))
        .query(async ({ctx, input}) => {
            return await ctx.db.order_styles.findMany({
                where: {
                    order_id: input.orderId,
                    order_checklist: {
                        none: {}
                    }
                },
                select: {
                    id: true,
                    style: true
                }
            })
        }),
    
    getShipmentForOrderChecklist: protectedProcedure
        .input(z.object({
            styleId: z.string()
        }))
        .query(async ({ctx, input}) => {
            return await ctx.db.shipment_details.findMany({
                where: {
                    order_style_id: input.styleId,
                    order_checklist: {
                        none: {}
                    }
                },
                select: {
                    id: true,
                    buyer_po: true
                }
            })
        })
})