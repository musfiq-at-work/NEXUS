import clsx from "clsx";
import { useId } from "react";
import type { Notification } from "~/types/notification";
import IconButton from "../atoms/IconButton";
import RelativeTime from "../atoms/RelativeTime";
import UiIcon from "../atoms/UiIcon";

export const notificationStyles = {
	SUCCESS: "bg-secondary-accent",
	WARNING: "bg-warning",
	ERROR: "bg-red-accent",
	INFO: "bg-primary-accent",
};

type NotificationCardProps = {
	notification: Notification;
	onMarkRead: (id: string) => void;
	onDismiss: (id: string) => void;
};

const NotificationCard = ({ notification, onMarkRead, onDismiss }: NotificationCardProps) => {
	const bodyId = useId();
	const { id, title, body, event_type, is_marked, added_at, module_name } = notification;

	return (
		<article
			className={clsx(
				"rounded-xl bg-white p-3 shadow-sm flex flex-row h-full gap-3",
			)}
		>
			<span className={clsx("w-1.5 shrink-0 self-stretch rounded-lg", notificationStyles[event_type])} />
			<div>
				<div className="flex items-start gap-2">
					<button
						type="button"
						aria-controls={bodyId}
						className="focus-visible:outline-primary flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded py-1 
							text-left text-sm leading-5 font-semibold text-gray-900 focus-visible:outline-2"
					>
						<span className="flex-1">{title}</span>
					</button>
					<IconButton
						label={`Dismiss ${title}`}
						onClick={() => onDismiss(id)}
						className="size-7"
					>
						<UiIcon name="close" />
					</IconButton>
				</div>
				<div id={bodyId} className="mt-1">
					<p className="text-sm leading-6 text-gray-600">{body}</p>
				</div>
				<div className="mt-3 flex items-center justify-between gap-2 text-xs pr-3">
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
			</div>
		</article>
	);
}

export default NotificationCard;