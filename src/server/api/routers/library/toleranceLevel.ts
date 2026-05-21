import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const toleranceLevelRouter = createTRPCRouter({
    getToleranceByBuyer: protectedProcedure
        .input(z.object({ buyerID: z.number() }))
        .query(async ({ ctx, input }) => {
            const tolerance = await ctx.db.shipment_tolerance_level.findUnique({
                where: { buyer_id: input.buyerID },
                select: {
                    tolerance_level: true,
                },
            });

            return tolerance?.tolerance_level ?? 10; // Default to 10% if not set
        }),

    });