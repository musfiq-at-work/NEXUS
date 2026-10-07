import clsx from "clsx";
import { useId, useState } from "react";
import type { Notification } from "~/types/notification";
import IconButton from "../atoms/IconButton";
import RelativeTime from "../atoms/RelativeTime";
import UiIcon from "../atoms/UiIcon";
import NotificationStatusIcon, {
  notificationStyles,
} from "../atoms/NotificationStatusIcon";

type NotificationCardProps = {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
};

export default function NotificationCard({
  notification,
  onMarkRead,
  onDismiss,
}: NotificationCardProps) {
  const [expanded, setExpanded] = useState(true);
  const bodyId = useId();
  const { id, title, body, event_type, is_marked, added_at, module_name } =
    notification;

  return (
    <article
      className={clsx(
        "rounded-xl border border-l-[5px] border-gray-200 bg-white p-3 shadow-sm",
        notificationStyles[event_type].border,
      )}
    >
      <div className="flex items-start gap-2">
        <NotificationStatusIcon type={event_type} />
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((value) => !value)}
          className="focus-visible:outline-primary flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded py-1 text-left text-sm leading-5 font-semibold text-gray-900 focus-visible:outline-2"
        >
          <span className="flex-1">{title}</span>
          <UiIcon
            name="chevron-down"
            className={clsx(
              "mt-0.5 size-4 shrink-0 text-gray-400 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
        <IconButton
          label={`Dismiss ${title}`}
          onClick={() => onDismiss(id)}
          className="size-7"
        >
          <UiIcon name="close" />
        </IconButton>
      </div>
      <div id={bodyId} hidden={!expanded} className="mt-1 pl-9">
        <p className="text-sm leading-6 text-gray-600">{body}</p>
        <span className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
          {module_name ?? "System"}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 pl-9 text-xs">
        <RelativeTime date={added_at} />
        {is_marked ? (
          <span className="text-gray-400">Read</span>
        ) : (
          <button
            type="button"
            onClick={() => onMarkRead(id)}
            className="text-primary focus-visible:outline-primary flex cursor-pointer items-center gap-1.5 rounded hover:underline focus-visible:outline-2"
          >
            <span
              className="bg-primary size-1.5 rounded-full"
              aria-hidden="true"
            />
            Mark as read
          </button>
        )}
      </div>
    </article>
  );
}
