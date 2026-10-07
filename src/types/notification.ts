import type { notifications, notification_types } from "@prisma/client";

export type Notification = notifications & { module_name: string | null };
export type NotificationType = notification_types;
export type NotificationFilter = "all" | "unread" | "system";
