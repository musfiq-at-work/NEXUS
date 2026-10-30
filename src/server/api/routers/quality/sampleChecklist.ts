import { actions, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { getPPMeetingOrderAccess as getOrderAccess } from "~/server/_utils/ppMeetingAccess";
import { sampleChecklistImagesInclude } from "~/server/_utils/sampleChecklist";
import { getSampleChecklistAccess, getSampleChecklistBuyerAccess } from "~/server/_utils/sampleChecklistAccess";
import { deleteSampleChecklist } from "~/server/_utils/deleteSampleChecklist";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { m } from "~/utils/moduleMap";
import { sampleChecklistFormSchema } from "~/app/(authed)/quality/sample_checklist/config/formSchema";
import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";

const checklistProcedure = protectedProcedure.use(({ ctx, next }) => {
    const permissions = ctx.permissions[m.SAMPLE_CHECKLIST];
    if (!permissions?.can_view && !permissions?.can_add && !permissions?.can_update) {
        throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "You do not have permission to access Sample Checklists." 
        });
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
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Sample Checklists." 
                });
            }

            const query = input.query?.trim();
            const where: Prisma.sample_check_listWhereInput = {
                ...getSampleChecklistAccess(ctx.user),
                ...(query
                    ? {
                          OR: [
                                { style_no_manual: { contains: query, mode: "insensitive" } },
                                { 
                                    buyers: { 
                                        buyer_name: { 
                                            contains: query, mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    factories: { 
                                        name: { 
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    order_styles: { 
                                        style: {
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    order_styles: { 
                                        buyer_orders: { 
                                            ref_no: { 
                                                contains: query, 
                                                mode: "insensitive" 
                                            } 
                                        } 
                                    } 
                                },
                                { 
                                    colors: { 
                                        name: { 
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    sample_types: { 
                                        name: { 
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                          ],
                      }
                    : {}),
            };

            const [records, total] = await Promise.all([
                ctx.db.sample_check_list.findMany({
                    where,
                    select: {
                        id: true,
                        with_order: true,
                        style_id: true,
                        style_no_manual: true,
                        sample_check_date: true,
                        sample_size: true,
                        sample_quantity: true,
                        buyers: { 
                            select: { 
                                buyer_name: true 
                            } 
                        },
                        factories: { 
                            select: { 
                                name: true 
                            } 
                        },
                        colors: { 
                            select: { 
                                name: true 
                            } 
                        },
                        sample_types: { 
                            select: { 
                                name: true 
                            } 
                        },
                        order_styles: { 
                            select: { 
                                style: true, 
                                buyer_orders: { 
                                    select: { 
                                        ref_no: true 
                                    } 
                                } 
                            } 
                        },
                    },
                    orderBy: [
                        { added_at: "desc" }, 
                        { id: "desc" }
                    ],
                    take: input.limit,
                    skip: input.offset,
                }),

                ctx.db.sample_check_list.count({ where }),
            ]);

            return {
                checklists: records.map((record) => {
                    const withOrder = record.with_order ?? !!record.style_id;
                    return {
                        id: record.id,
                        with_order: withOrder,
                        sample_check_date: record.sample_check_date,
                        buyer_name: record.buyers.buyer_name,
                        factory_name: record.factories.name,
                        ref_no: withOrder ? (record.order_styles?.buyer_orders.ref_no ?? "-") : "-",
                        style: withOrder ? (record.order_styles?.style ?? "-") : (record.style_no_manual ?? "-"),
                        color: record.colors.name,
                        sample_type: record.sample_types.name,
                        sample_size: record.sample_size,
                        sample_quantity: record.sample_quantity,
                    };
                }),
                total,
            };
        }),

    getSampleChecklistById: checklistProcedure
        .input(z.object({ 
            id: z.string().uuid() 
        }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Sample Checklists." 
                });
            }

            const checklist = await ctx.db.sample_check_list.findFirst({
                where: { 
                    ...getSampleChecklistAccess(ctx.user),
                    id: input.id, 
                },
                include: {
                    ...sampleChecklistImagesInclude,
                    buyers: { 
                        select: { 
                            buyer_name: true 
                        } 
                    },
                    factories: { 
                        select: { 
                            name: true 
                        } 
                    },
                    colors: { 
                        select: { 
                            name: true 
                        } 
                    },
                    sample_types: { 
                        select: { 
                            name: true 
                        } 
                    },
                    order_styles: { 
                        select: { 
                            order_id: true, 
                            style: true,
                            buyer_orders: { 
                                select: { 
                                    ref_no: true
                                } 
                            } 
                        } 
                    },
                },
            });

            if (!checklist) throw new TRPCError({ 
                code: "NOT_FOUND", 
                message: "Sample Checklist not found." 
            });

            const withOrder = checklist.with_order ?? !!checklist.style_id;
            return { ...checklist, with_order: withOrder, order_id: withOrder ? (checklist.order_styles?.order_id ?? "") : "" };
        }),

    getOrders: checklistProcedure
        .input(z.object({ 
            buyerId: z.number().int().positive(), 
            factoryId: z.number().int().positive() 
        }))
        .query(async ({ ctx, input }) => {
            return ctx.db.buyer_orders.findMany({
                where: { 
                    ...getOrderAccess(ctx.user), 
                    buyer_id: input.buyerId, 
                    factory_id: input.factoryId 
                },
                select: { 
                    id: true, 
                    ref_no: true 
                },
                orderBy: { 
                    ref_no: "asc" 
                },
            });
        }),

    getStyles: checklistProcedure
        .input(z.object({ 
            buyerId: z.number().int().positive(), 
            factoryId: z.number().int().positive() 
        }))
        .query(async ({ ctx, input }) => {
            return ctx.db.order_styles.findMany({
                where: {
                    buyer_orders: { 
                        ...getOrderAccess(ctx.user), 
                        buyer_id: input.buyerId, 
                        factory_id: input.factoryId 
                    },
                },
                select: { 
                    id: true, 
                    style: true,
                    order_id: true,
                    buyer_orders: { select: { ref_no: true } },
                },
                orderBy: [
                    { style: "asc" },
                    { buyer_orders: { ref_no: "asc" } },
                    { serial: "asc" }
                ],
            });
        }),

    getStyleOptions: checklistProcedure
        .input(z.object({ 
            styleId: z.string().uuid() 
        }))
        .query(async ({ ctx, input }) => {
            const access = { 
                order_style_id: input.styleId,
                order_styles: { 
                    buyer_orders: getOrderAccess(ctx.user) 
                } 
            };
            const [colorGroups, shipments] = await Promise.all([
                ctx.db.shipment_item_details.groupBy({
                    by: ["color_id"],
                    where: { 
                        shipment_details: access 
                    },
                }),
                ctx.db.shipment_details.findMany({
                    where: access,
                    select: { 
                        buyer_department_sizes: { 
                            select: { 
                                size: true 
                            } 
                        } 
                    },
                    orderBy: [
                        { serial: "asc" }, 
                        { id: "asc" }
                    ],
                }),
            ]);

            const colors = await ctx.db.colors.findMany({
                where: { 
                    id: { 
                        in: colorGroups.map((group) => group.color_id) 
                    } 
                },
                select: { 
                    id: true, 
                    name: true 
                },
                orderBy: { 
                    name: "asc" 
                },
            });

            return { colors, sizes: [...new Set(shipments.map((shipment) => shipment.buyer_department_sizes.size))] };
        }),

    getManualOptions: checklistProcedure
        .input(z.object({ buyerId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const buyer = await ctx.db.buyers.findFirst({
                where: { ...getSampleChecklistBuyerAccess(ctx.user), id: input.buyerId },
                select: { id: true },
            });
            if (!buyer) throw new TRPCError({ code: "NOT_FOUND", message: "Buyer not found." });

            const [colors, sizes] = await Promise.all([
                ctx.db.colors.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
                ctx.db.buyer_department_sizes.findMany({
                    where: { buyer_departments: { buyer_brands: { buyer_id: input.buyerId } } },
                    distinct: ["size"],
                    select: { size: true },
                    orderBy: { size: "asc" },
                }),
            ]);

            return { colors, sizes: sizes.map((size) => size.size) };
        }),

    deleteSampleChecklist: protectedProcedure
        .input(z.object({ 
            id: z.string().uuid() 
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete Sample Checklists." 
                });
            }

            try {
                return await deleteSampleChecklist(ctx.db, { 
                    id: input.id, 
                    checklistAccess: getSampleChecklistAccess(ctx.user),
                    actionBy: ctx.user.id 
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    saveSampleChecklist: checklistProcedure
        .input(sampleChecklistFormSchema.and(z.object({
            id: z.string().uuid().optional() 
        })))
        .mutation(async ({ ctx, input }) => {
            const { id, order_id, sample_check_date, ...values } = input;
            const permission = input.id ? "can_update" : "can_add";

            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.[permission]) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: `You do not have permission to ${input.id ? "update" : "add"} Sample Checklists.` 
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    if (input.id) {
                        const existing = await tx.sample_check_list.findFirst({
                            where: { 
                                ...getSampleChecklistAccess(ctx.user),
                                id: input.id, 
                            },
                            select: { 
                                id: true 
                            },
                        });

                        if (!existing) throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Sample Checklist not found." 
                        });
                    }

                    const [buyer, factory, sampleType, color] = await Promise.all([
                        tx.buyers.findFirst({ where: { ...getSampleChecklistBuyerAccess(ctx.user), id: input.buyer_id }, select: { id: true } }),
                        tx.factories.findUnique({ where: { id: input.factory_id }, select: { id: true } }),
                        tx.sample_types.findUnique({ where: { id: input.sample_type }, select: { id: true } }),
                        tx.colors.findUnique({ where: { id: input.color_id }, select: { id: true } }),
                    ]);
                    if (!buyer || !factory || !sampleType || !color) {
                        throw new TRPCError({ code: "BAD_REQUEST", message: "Select an available buyer, factory, sample type, and color." });
                    }

                    if (input.with_order) {
                        const style = await tx.order_styles.findFirst({
                            where: {
                                id: input.style_id,
                                order_id,
                                buyer_orders: { ...getOrderAccess(ctx.user), buyer_id: input.buyer_id, factory_id: input.factory_id },
                            },
                            select: { id: true },
                        });
                        if (!style) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a style belonging to the selected buyer, factory, and order." });

                        const styleColor = await tx.shipment_item_details.findFirst({
                            where: { color_id: input.color_id, shipment_details: { order_style_id: style.id } },
                            select: { id: true },
                        });
                        if (!styleColor) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a color available in the selected style." });

                        if (input.sample_size) {
                            const size = await tx.shipment_details.findFirst({
                                where: { order_style_id: style.id, buyer_department_sizes: { size: input.sample_size } },
                                select: { id: true },
                            });
                            if (!size) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a size available in the selected style." });
                        }
                    } else if (input.sample_size) {
                        const size = await tx.buyer_department_sizes.findFirst({
                            where: { size: input.sample_size, buyer_departments: { buyer_brands: { buyer_id: input.buyer_id } } },
                            select: { id: true },
                        });
                        if (!size) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a size belonging to the selected buyer." });
                    }

                    const data = { 
                        ...values, 
                        style_id: input.with_order ? input.style_id : null,
                        style_no_manual: input.with_order ? null : input.style_no_manual,
                        sample_check_date: new Date(`${sample_check_date}T00:00:00.000Z`) 
                    };

                    const checklist = id ? await tx.sample_check_list.update({ 
                        where: { id }, 
                        data 
                    }) : await tx.sample_check_list.create({ data });

                    // This history table has no checklist foreign key; save its scalar snapshot atomically.
                    await tx.sample_check_list_history.create({
                        data: { 
                            ...data, 
                            action_by: ctx.user.id, 
                            action_type: id ? actions.UPDATE : actions.ADDED 
                        },
                    });

                    return checklist.id;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});
