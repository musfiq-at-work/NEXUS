import { actions, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { getPPMeetingOrderAccess as getOrderAccess } from "~/server/_utils/ppMeetingAccess";
import { sampleChecklistImagesInclude } from "~/server/_utils/sampleChecklist";
import { deleteSampleChecklist } from "~/server/_utils/deleteSampleChecklist";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { m } from "~/utils/moduleMap";
import { sampleChecklistFormSchema } from "~/app/(authed)/quality/sample_checklist/config/formSchema";

const checklistProcedure = protectedProcedure.use(({ ctx, next }) => {
    const permissions = ctx.permissions[m.SAMPLE_CHECKLIST];
    if (!permissions?.can_view && !permissions?.can_add && !permissions?.can_update) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access Sample Checklists." });
    }

    return next({ ctx });
});

export const sampleChecklistRouter = createTRPCRouter({
    getSampleChecklists: checklistProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(100).default(15),
                offset: z.number().int().min(0).default(0),
                query: z.string().optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_view) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view Sample Checklists." });
            }

            const query = input.query?.trim();
            const where: Prisma.sample_check_listWhereInput = {
                order_styles: { buyer_orders: getOrderAccess(ctx.user) },
                ...(query
                    ? {
                          OR: [
                              { buyers: { buyer_name: { contains: query, mode: "insensitive" } } },
                              { factories: { name: { contains: query, mode: "insensitive" } } },
                              { order_styles: { style: { contains: query, mode: "insensitive" } } },
                              { order_styles: { buyer_orders: { ref_no: { contains: query, mode: "insensitive" } } } },
                              { colors: { name: { contains: query, mode: "insensitive" } } },
                              { sample_types: { name: { contains: query, mode: "insensitive" } } },
                          ],
                      }
                    : {}),
            };

            const [records, total] = await Promise.all([
                ctx.db.sample_check_list.findMany({
                    where,
                    select: {
                        id: true,
                        sample_check_date: true,
                        sample_size: true,
                        sample_quantity: true,
                        buyers: { select: { buyer_name: true } },
                        factories: { select: { name: true } },
                        colors: { select: { name: true } },
                        sample_types: { select: { name: true } },
                        order_styles: { select: { style: true, buyer_orders: { select: { ref_no: true } } } },
                    },
                    orderBy: [{ added_at: "desc" }, { id: "desc" }],
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.db.sample_check_list.count({ where }),
            ]);

            return {
                checklists: records.map((record) => ({
                    id: record.id,
                    sample_check_date: record.sample_check_date,
                    buyer_name: record.buyers.buyer_name,
                    factory_name: record.factories.name,
                    ref_no: record.order_styles.buyer_orders.ref_no,
                    style: record.order_styles.style,
                    color: record.colors.name,
                    sample_type: record.sample_types.name,
                    sample_size: record.sample_size,
                    sample_quantity: record.sample_quantity,
                })),
                total,
            };
        }),

    getSampleChecklistById: checklistProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
        if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_view && !ctx.permissions[m.SAMPLE_CHECKLIST]?.can_update) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view Sample Checklists." });
        }

        const checklist = await ctx.db.sample_check_list.findFirst({
            where: { id: input.id, order_styles: { buyer_orders: getOrderAccess(ctx.user) } },
            include: {
                ...sampleChecklistImagesInclude,
                buyers: { select: { buyer_name: true } },
                factories: { select: { name: true } },
                colors: { select: { name: true } },
                sample_types: { select: { name: true } },
                order_styles: { select: { order_id: true, style: true, buyer_orders: { select: { ref_no: true } } } },
            },
        });
        if (!checklist) throw new TRPCError({ code: "NOT_FOUND", message: "Sample Checklist not found." });

        return { ...checklist, order_id: checklist.order_styles.order_id };
    }),

    getOrders: checklistProcedure
        .input(z.object({ buyerId: z.number().int().positive(), factoryId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.buyer_orders.findMany({
                where: { ...getOrderAccess(ctx.user), buyer_id: input.buyerId, factory_id: input.factoryId },
                select: { id: true, ref_no: true },
                orderBy: { ref_no: "asc" },
            });
        }),

    getStyles: checklistProcedure
        .input(z.object({ orderId: z.string().uuid(), buyerId: z.number().int().positive(), factoryId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.order_styles.findMany({
                where: {
                    order_id: input.orderId,
                    buyer_orders: { ...getOrderAccess(ctx.user), buyer_id: input.buyerId, factory_id: input.factoryId },
                },
                select: { id: true, style: true },
                orderBy: [{ serial: "asc" }, { style: "asc" }],
            });
        }),

    getStyleOptions: checklistProcedure.input(z.object({ styleId: z.string().uuid() })).query(async ({ ctx, input }) => {
        const access = { order_style_id: input.styleId, order_styles: { buyer_orders: getOrderAccess(ctx.user) } };
        const [colorGroups, shipments] = await Promise.all([
            ctx.db.shipment_item_details.groupBy({
                by: ["color_id"],
                where: { shipment_details: access },
            }),
            ctx.db.shipment_details.findMany({
                where: access,
                select: { buyer_department_sizes: { select: { size: true } } },
                orderBy: [{ serial: "asc" }, { id: "asc" }],
            }),
        ]);
        const colors = await ctx.db.colors.findMany({
            where: { id: { in: colorGroups.map((group) => group.color_id) } },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        });

        return { colors, sizes: [...new Set(shipments.map((shipment) => shipment.buyer_department_sizes.size))] };
    }),

    deleteSampleChecklist: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
        if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_delete) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to delete Sample Checklists." });
        }

        try {
            return await deleteSampleChecklist(ctx.db, { id: input.id, orderAccess: getOrderAccess(ctx.user), actionBy: ctx.user.id });
        } catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    saveSampleChecklist: checklistProcedure.input(sampleChecklistFormSchema.extend({ id: z.string().uuid().optional() })).mutation(async ({ ctx, input }) => {
        const { id, order_id, sample_check_date, ...values } = input;
        const permission = input.id ? "can_update" : "can_add";
        if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.[permission]) {
            throw new TRPCError({ code: "FORBIDDEN", message: `You do not have permission to ${input.id ? "update" : "add"} Sample Checklists.` });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                if (input.id) {
                    const existing = await tx.sample_check_list.findFirst({
                        where: { id: input.id, order_styles: { buyer_orders: getOrderAccess(ctx.user) } },
                        select: { id: true },
                    });
                    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Sample Checklist not found." });
                }

                const style = await tx.order_styles.findFirst({
                    where: {
                        id: input.style_id,
                        order_id,
                        buyer_orders: { ...getOrderAccess(ctx.user), buyer_id: input.buyer_id, factory_id: input.factory_id },
                    },
                    select: { id: true },
                });
                if (!style) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a style belonging to the selected buyer, factory, and order." });

                const color = await tx.shipment_item_details.findFirst({
                    where: { color_id: input.color_id, shipment_details: { order_style_id: input.style_id } },
                    select: { id: true },
                });
                if (!color) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a color available in the selected style." });

                if (input.sample_size) {
                    const size = await tx.shipment_details.findFirst({
                        where: { order_style_id: input.style_id, buyer_department_sizes: { size: input.sample_size } },
                        select: { id: true },
                    });
                    if (!size) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a size available in the selected style." });
                }

                const sampleType = await tx.sample_types.findUnique({ where: { id: input.sample_type }, select: { id: true } });
                if (!sampleType) throw new TRPCError({ code: "BAD_REQUEST", message: "Select an available sample type." });

                const data = { ...values, sample_check_date: new Date(`${sample_check_date}T00:00:00.000Z`) };
                const checklist = id ? await tx.sample_check_list.update({ where: { id }, data }) : await tx.sample_check_list.create({ data });

                // This history table has no checklist foreign key; save its scalar snapshot atomically.
                await tx.sample_check_list_history.create({
                    data: { ...data, action_by: ctx.user.id, action_type: id ? actions.UPDATE : actions.ADDED },
                });

                return checklist.id;
            });
        } catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),
});
