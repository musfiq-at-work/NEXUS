import type { Notification } from "~/types/notification";
import NotificationCard from "./NotificationCard";

type NotificationListProps = {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
};

export default function NotificationList({
  notifications,
  onMarkRead,
  onDismiss,
}: NotificationListProps) {
  if (!notifications.length) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
        role="status"
      >
        <p className="font-medium text-gray-900">No notifications here</p>
        <p className="mt-2 text-sm text-gray-500">
          There are no notifications in this filter.
        </p>
      </div>
    );
  }

  return (
    <ul
      aria-label="Notifications"
      className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4"
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
