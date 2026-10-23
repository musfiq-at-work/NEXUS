import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, type Prisma, type users } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

const checkList = [
    { status_name: 'PP sample approved?' },
    { status_name: 'Green/Yellow seal tag attach?' },
    { status_name: 'Trims card approved?' },
    { status_name: 'Approved Shade band available?' },
    { status_name: 'Approved Spec/Measurement sheet available?' },
    { status_name: 'Approved Folding method available?' },
    { status_name: 'Approved Packaging method available?' },
    { status_name: 'Risk Assessment/ LRM Comment available?' },
    { status_name: 'Size Set Wash Test Result?' },
];

const getChecklist = (id: string) => {
    return checkList.map((item) => ({
        ...item,
        pre_production_meeting_id: id
    }));
}

type MeetingUser = Pick<users, 'id' | 'department_id' | 'level_id'>;

const getOrderAccess = (user: MeetingUser): Prisma.buyer_ordersWhereInput => {
    if (user.department_id === ADMIN_DEPARTMENT_ID && user.level_id === ADMIN_LEVEL_ID) return {};

    return {
        buyers: {
            teams: {
                some: { team_members: { some: { user_id: user.id } } },
            },
        },
    };
};

export const ppMeetingRouter = createTRPCRouter({
    getPPMeetings: protectedProcedure
        .input(z.object({
            limit: z.number().int().min(1).max(100).default(15),
            offset: z.number().int().min(0).default(0),
            query: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view Pre Production Meetings.',
                });
            }

            const query = input.query?.trim();
            const where: Prisma.pre_production_meetingWhereInput = {
                order_styles: { buyer_orders: getOrderAccess(ctx.user) },
                ...(query ? {
                    OR: [
                        { factories: { name: { contains: query, mode: 'insensitive' } } },
                        { order_styles: { style: { contains: query, mode: 'insensitive' } } },
                        { order_styles: { buyer_orders: { ref_no: { contains: query, mode: 'insensitive' } } } },
                        { order_styles: { buyer_orders: { buyers: { buyer_name: { contains: query, mode: 'insensitive' } } } } },
                        { order_styles: { shipment_details: { some: { buyer_po: { contains: query, mode: 'insensitive' } } } } },
                    ],
                } : {}),
            };

            const [records, total] = await Promise.all([
                ctx.db.pre_production_meeting.findMany({
                    where,
                    select: {
                        id: true,
                        meeting_date: true,
                        daily_production_plan: true,
                        factories: { select: { name: true } },
                        order_styles: {
                            select: {
                                style: true,
                                order_quantity: true,
                                products: { select: { name: true } },
                                fabrics: { select: { name: true, description: true, value: true, unit: true } },
                                buyer_orders: { select: { ref_no: true, buyers: { select: { buyer_name: true } } } },
                            },
                        },
                    },
                    orderBy: [{ added_at: 'desc' }, { id: 'desc' }],
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.db.pre_production_meeting.count({ where }),
            ]);

            const meetings = records.map((record) => {
                const style = record.order_styles;
                const fabric = style.fabrics;

                return {
                    id: record.id,
                    meeting_date: record.meeting_date,
                    factory_name: record.factories.name,
                    buyer_name: style.buyer_orders.buyers.buyer_name,
                    ref_no: style.buyer_orders.ref_no,
                    style: style.style,
                    item: style.products.name,
                    fabric: fabric.description ?? fabric.name,
                    required_gsm: fabric.value != null ? `${fabric.value} ${fabric.unit ?? ''}`.trim() : null,
                    order_quantity: style.order_quantity,
                    daily_production_plan: record.daily_production_plan,
                };
            });

            return { meetings, total };
        }),

    getOrdersForPPMeeting: protectedProcedure
        .input(z.object({
            factoryId: z.number().int().positive()
        }))
        .query(async ({ctx, input}) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_add) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to add Pre Production Meetings.' });
            }

            return await ctx.db.buyer_orders.findMany({
                where: {
                    ...getOrderAccess(ctx.user),
                    factory_id: input.factoryId,
                    order_styles: {
                        some: {
                            pre_production_meeting: {
                                none: {}
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    ref_no: true
                },
                orderBy: { ref_no: 'asc' },
            })
        }),

    getStyleForPPMeeting: protectedProcedure
        .input(z.object({
            orderId: z.string().uuid()
        }))
        .query(async ({ctx, input}) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_add) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to add Pre Production Meetings.' });
            }

            return await ctx.db.order_styles.findMany({
                where: {
                    order_id: input.orderId,
                    buyer_orders: getOrderAccess(ctx.user),
                    pre_production_meeting: {
                        none: {}
                    }
                },
                select: {
                    id: true,
                    style: true,
                    order_quantity: true,
                    products: { select: { name: true } },
                    fabrics: { select: { name: true, description: true, value: true, unit: true } },
                    shipment_details: {
                        where: { factory_shipment_details: { isNot: null } },
                        select: {
                            factory_shipment_details: { select: { exfactory_date: true } },
                        },
                        orderBy: { factory_shipment_details: { exfactory_date: 'asc' } },
                        take: 1,
                    },
                },
                orderBy: { style: 'asc' },
            })
        }),

    addPPMeeting: protectedProcedure
        .input(z.object({
            factory_id: z.number().int().positive(),
            style_id: z.string().uuid(),
            daily_plan_quantity: z.number().int().positive().max(2147483647)
        }))
        .mutation(async ({ctx, input}) => {
            const can_add = ctx.permissions[m.PP_MEETING]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to add Pre Production Meeting.'
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const style = await tx.order_styles.findFirst({
                        where: {
                            id: input.style_id,
                            buyer_orders: { ...getOrderAccess(ctx.user), factory_id: input.factory_id },
                            pre_production_meeting: { none: {} },
                        },
                        select: { id: true },
                    });

                    if (!style) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'This style is unavailable for a PP meeting at the selected factory. Refresh the order and style selections.',
                        });
                    }

                    const ppMeeting = await tx.pre_production_meeting.create({
                        data: {
                            factory_id: input.factory_id,
                            style_id: input.style_id,
                            daily_production_plan: input.daily_plan_quantity
                        }
                    });

                    await tx.pre_production_meeting_history.create({
                        data: {
                            pre_production_meeting_id: ppMeeting.id,
                            factory_id: input.factory_id,
                            style_id: input.style_id,
                            daily_production_plan: input.daily_plan_quantity,
                            action_by: ctx.user.id,
                            action_type: actions.ADDED
                        }
                    });

                    const items = await tx.shipment_item_details.findMany({
                        where: {
                            shipment_details: {
                                order_style_id: input.style_id,
                            },
                        },
                        select: {
                            color_id: true,
                            shipment_detail_id: true,
                        },
                    });

                    await tx.production_plan.createMany({
                        data: items.map((item) => ({
                            pre_production_meeting_id: ppMeeting.id,
                            color_id: item.color_id,
                            shipment_id: item.shipment_detail_id,
                        }))
                    });

                    await tx.approval_status.createMany({
                        data: getChecklist(ppMeeting.id)
                    })

                    return ppMeeting.id;

                })
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),    
})
