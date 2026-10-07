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
  const { filter, setFilter, counts, visibleNotifications, markRead, dismiss } =
    useNotifications();

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
        <div className="shrink-0 space-y-5 border-b border-gray-200 bg-white px-5 pt-6 pb-4">
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
        <NotificationList
          notifications={visibleNotifications}
          onMarkRead={markRead}
          onDismiss={dismiss}
        />
        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => markRead()}
            disabled={counts.unread === 0}
            className="text-primary hover:text-primary-dark focus-visible:outline-primary cursor-pointer rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 disabled:cursor-default disabled:text-gray-400 disabled:no-underline"
          >
            Mark all as read
          </button>
        </div>
      </SidePanel>
    </>
  );
}
