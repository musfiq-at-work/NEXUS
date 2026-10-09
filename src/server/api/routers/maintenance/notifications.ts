import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const notificationsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
		.query(async ({ ctx, input }) => {
			const where = { recipient_id: ctx.user.id };
			const [items, unreadCount] = await Promise.all([
				ctx.db.notifications.findMany({
					where,
					orderBy: { added_at: "desc" },
					take: input.limit,
				}),
				ctx.db.notifications.count({ where: { ...where, marked_at: null } }),
			]);
			return { items, unreadCount };
		}),
		
	markRead: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(({ ctx, input }) =>
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
