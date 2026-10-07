import Image from "next/image";
import { notificationIcon } from "~/assets";
import IconButton from "../atoms/IconButton";

type NotificationTriggerProps = {
	open: boolean;
	unreadCount: number;
	onClick: () => void;
};

const NotificationTrigger = ({open, unreadCount, onClick }: NotificationTriggerProps) => {
    return (
        <IconButton
			label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
			aria-expanded={open}
			aria-haspopup="dialog"
			aria-controls={open ? "notification-panel" : undefined}
			onClick={onClick}
			className="relative mx-2 my-4 size-9"
        >
          	<Image src={notificationIcon.src} alt="" width={30} height={30} />
			{unreadCount > 0 && (
				<span
					aria-hidden="true"
					className="bg-primary ring-background absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white ring-2"
				>
					{unreadCount > 99 ? "99+" : unreadCount}
				</span>
			)}
        </IconButton>
    );
}

export default NotificationTrigger;