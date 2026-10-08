"use client";

import { useCallback, useState } from "react";
import useNotifications from "~/hooks/useNotifications";
import NotificationFilters from "../molecules/NotificationFilters";
import NotificationList from "../molecules/NotificationList";
import NotificationPanelHeader from "../molecules/NotificationPanelHeader";
import NotificationTrigger from "../molecules/NotificationTrigger";
import SidePanel from "../molecules/SidePanel";

export default function NotificationCenter() {
	const [open, setOpen] = useState(false);
	const close = useCallback(() => setOpen(false), []);
	const { filter, setFilter, counts, visibleNotifications, markRead, dismiss } = useNotifications();

	return (
		<>
			<NotificationTrigger
				open={open}
				unreadCount={counts.unread}
				onClick={() => setOpen((value) => !value)}
			/>
			<SidePanel
				open={open}
				id="notification-panel"
				labelledBy="notification-panel-title"
				closeLabel="Close notifications"
				onClose={close}
			>
				<div className="shrink-0 space-y-3 border-b border-gray-200 bg-white px-4 pt-6 pb-4">
					<NotificationPanelHeader
						unreadCount={counts.unread}
						onClose={close}
					/>
					<NotificationFilters
						selected={filter}
						counts={counts}
						onChange={setFilter}
					/>
				</div>
				<div className="relative flex min-h-0 flex-1 flex-col">
					<NotificationList
						notifications={visibleNotifications}
						onMarkRead={markRead}
						onDismiss={dismiss}
					/>
					<button
						type="button"
						aria-label="Mark all as read"
						title="Mark all as read"
						onClick={() => markRead()}
						disabled={counts.unread === 0}
						className="bg-secondary hover:bg-secondary-accent focus-visible:outline-secondary absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] 
							z-10 flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-colors focus-visible:outline-2 
							focus-visible:outline-offset-2 disabled:cursor-default disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							className="size-6"
							aria-hidden="true"
						>
							<path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>
				</div>
			</SidePanel>
		</>
	);
}
