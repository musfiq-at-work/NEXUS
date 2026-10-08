import type { Notification } from "~/types/notification";
import NotificationCard from "./NotificationCard";

type NotificationListProps = {
	notifications: Notification[];
	onMarkRead: (id: string) => void;
	onDismiss: (id: string) => void;
};

const NotificationList = ({ notifications, onMarkRead, onDismiss }: NotificationListProps) => {
	if (!notifications.length) {
		return (
			<div
				className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
				role="status"
			>
				<p className="font-medium text-gray-900">No notifications here</p>
				<p className="mt-2 text-sm text-gray-500">
					You are all caught up!
				</p>
			</div>
		);
	}

	return (
		<ul
			aria-label="Notifications"
			className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pl-4 pr-2 pt-3 pb-[calc(5rem+env(safe-area-inset-bottom))]"
		>
			{notifications.map((notification) => (
				<li key={notification.id}>
					<NotificationCard
						notification={notification}
						onMarkRead={onMarkRead}
						onDismiss={onDismiss}
					/>
				</li>
			))}
		</ul>
	);
}

export default NotificationList;
