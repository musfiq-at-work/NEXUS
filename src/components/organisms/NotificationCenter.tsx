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
  const {
    filter,
    setFilter,
    counts,
    visibleNotifications,
    markRead,
    dismiss,
    isLoading,
    hasError,
    isRefreshing,
    isMarkingRead,
    isAtLimit,
    refresh,
  } = useNotifications(open);

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
            isLoading={isLoading}
            hasError={hasError}
            onClose={close}
          />
          <NotificationFilters
            selected={filter}
            counts={counts}
            onChange={setFilter}
          />
          {isAtLimit && (
            <p className="text-xs text-gray-500">
              Showing the 50 most recent notifications.
            </p>
          )}
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <NotificationList
            notifications={visibleNotifications}
            isLoading={isLoading}
            hasError={hasError}
            isRefreshing={isRefreshing}
            isMarkingRead={isMarkingRead}
            onRetry={refresh}
            onMarkRead={markRead}
            onDismiss={dismiss}
            onOpen={close}
          />
          <button
            type="button"
            aria-label="Mark all as read"
            title="Mark all as read"
            onClick={() => markRead()}
            disabled={
              counts.unread === 0 || isLoading || hasError || isMarkingRead
            }
            className="bg-secondary hover:bg-secondary-accent focus-visible:outline-secondary absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-6"
              aria-hidden="true"
            >
              <path
                d="m5 12 4 4L19 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </SidePanel>
    </>
  );
}
