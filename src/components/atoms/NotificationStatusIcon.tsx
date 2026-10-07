import clsx from "clsx";
import type { NotificationType } from "~/types/notification";

export const notificationStyles = {
  SUCCESS: {
    label: "Success",
    border: "border-l-green-500",
    icon: "bg-green-50 text-green-600",
  },
  WARNING: {
    label: "Warning",
    border: "border-l-orange-500",
    icon: "bg-orange-50 text-orange-600",
  },
  ERROR: {
    label: "Error",
    border: "border-l-red-500",
    icon: "bg-red-50 text-red-600",
  },
  INFO: {
    label: "Info",
    border: "border-l-sky-400",
    icon: "bg-sky-50 text-sky-500",
  },
} satisfies Record<
  NotificationType,
  { label: string; border: string; icon: string }
>;

export default function NotificationStatusIcon({
  type,
}: {
  type: NotificationType;
}) {
  return (
    <span
      className={clsx(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
        notificationStyles[type].icon,
      )}
      role="img"
      aria-label={notificationStyles[type].label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="size-4"
        aria-hidden="true"
      >
        {type === "SUCCESS" ? (
          <path
            d="m5 12 4 4L19 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : type === "ERROR" ? (
          <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            {type === "WARNING" ? (
              <path d="M12 7v6m0 3v1" />
            ) : (
              <path d="M12 11v6m0-10v1" />
            )}
          </>
        )}
      </svg>
    </span>
  );
}
