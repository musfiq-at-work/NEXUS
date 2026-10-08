"use client";

import { useState } from "react";
import { createDummyNotifications } from "~/data/notifications";
import type { NotificationFilter } from "~/types/notification";

export default function useNotifications() {
	const [notifications, setNotifications] = useState(createDummyNotifications);
	const [filter, setFilter] = useState<NotificationFilter>("unread");

	const counts = {
		all: notifications.length,
		unread: notifications.filter((notification) => !notification.is_marked).length,
		system: notifications.filter((notification) => notification.module_id === null).length,
	};

	const visibleNotifications = notifications.filter((notification) => {
		if (filter === "unread") return !notification.is_marked;
		if (filter === "system") return notification.module_id === null;
		return true;
	});

	const markRead = (id?: string) => {
		const marked_at = new Date();
		setNotifications((current) =>
			current.map((notification) =>
				!notification.is_marked && (id === undefined || notification.id === id)
					? { ...notification, is_marked: true, marked_at }
					: notification
			)
		);
	};

	const dismiss = (id: string) => {
		setNotifications((current) => current.filter((notification) => notification.id !== id));
	};

	return { filter, setFilter, counts, visibleNotifications, markRead, dismiss };
}
