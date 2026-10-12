import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { NotificationModuleOption } from "~/types/notification";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { m } from "~/utils/moduleMap";

const notificationPageSize = 50;
const notificationModuleIds = [m.FACTORY_ORDERS, m.SALES_CONTRACTS, m.COMMISSION_DISTRIBUTION, m.LC_MASTER, m.EX_FACTORIES, m.RDL_INVOICE, m.CROSS_PAYMENT];

export const notificationsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            z.object({
                page: z.number().int().min(1).default(1),
                filter: z.enum(["all", "unread", "system"]).default("all"),
                moduleId: z.number().int().positive().nullable().default(null),
                dismissedIds: z.array(z.string().uuid()).default([]),
            }),
        )
        .query(async ({ ctx, input }) => {
            const isAdmin = ctx.user.level_id === ADMIN_LEVEL_ID && ctx.user.department_id === ADMIN_DEPARTMENT_ID;
            let modules: NotificationModuleOption[];

            if (isAdmin) {
                modules = await ctx.db.modules.findMany({
                    where: { id: { in: notificationModuleIds } },
                    select: { id: true, name: true },
                    orderBy: { name: "asc" },
                });
            } else {
                modules = await ctx.db.$queryRaw<NotificationModuleOption[]>`
                    SELECT DISTINCT m.id, m.name
                    FROM level_permission AS lp
                        INNER JOIN users AS u ON u.level_id = lp.level_id AND u.department_id = lp.department_id
                        INNER JOIN authorizations AS a ON a.department_id = u.department_id AND a.level_id = u.level_id
                        INNER JOIN modules AS m ON m.id = a.module_id
                    WHERE u.id = ${ctx.user.id}::uuid
                        AND m.id IN (${Prisma.join(notificationModuleIds)})
                    ORDER BY m.name ASC;
                `;
            }

            if (input.moduleId !== null && !modules.some((module) => module.id === input.moduleId)) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this notification module filter." });
            }

            const recipientWhere = { recipient_id: ctx.user.id };

            const baseWhere: Prisma.notificationsWhereInput = {
                ...recipientWhere,
                ...(input.dismissedIds.length > 0 ? { id: { notIn: input.dismissedIds } } : {}),
            };

            const moduleWhere: Prisma.notificationsWhereInput = {
                ...baseWhere,
                ...(input.moduleId !== null ? { module_id: input.moduleId } : {}),
            };

            const systemWhere = { ...baseWhere, module_id: null };
            
            const [allCount, pendingCount, systemCount, globalUnreadCount] = await Promise.all([
                ctx.db.notifications.count({ where: moduleWhere }),
                ctx.db.notifications.count({ where: { ...moduleWhere, marked_at: null } }),
                ctx.db.notifications.count({ where: systemWhere }),
                input.moduleId === null && input.dismissedIds.length === 0
                    ? Promise.resolve(null)
                    : ctx.db.notifications.count({ where: { ...recipientWhere, marked_at: null } }),
            ]);

            const counts = { all: allCount, unread: pendingCount, system: systemCount };
            const total = counts[input.filter];
            const totalPages = Math.max(1, Math.ceil(total / notificationPageSize));
            const page = Math.min(input.page, totalPages);
            const where: Prisma.notificationsWhereInput = input.filter === "system" ? systemWhere : { ...moduleWhere };
            if (input.filter === "unread") where.marked_at = null;

            const items = await ctx.db.notifications.findMany({
                where,
                orderBy: [{ added_at: "desc" }, { id: "desc" }],
                skip: (page - 1) * notificationPageSize,
                take: notificationPageSize,
            });

            return { items, counts, unreadCount: globalUnreadCount ?? pendingCount, modules, page, pageSize: notificationPageSize, total, totalPages };
        }),

    markRead: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) =>
        ctx.db.notifications.updateMany({
            where: { id: input.id, recipient_id: ctx.user.id, marked_at: null },
            data: { marked_at: new Date(), is_marked: true },
        }),
    ),

    markAllRead: protectedProcedure.mutation(({ ctx }) =>
        ctx.db.notifications.updateMany({
            where: { recipient_id: ctx.user.id, marked_at: null },
            data: { marked_at: new Date(), is_marked: true },
        }),
    ),
});
