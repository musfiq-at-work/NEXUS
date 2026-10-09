"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { NotificationFilter } from "~/types/notification";
import { parseTRPCError } from "~/utils/parseTRPCError";

export default function useNotifications(open = false) {
  const [filter, setFilter] = useState<NotificationFilter>("unread");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const utils = api.useUtils();
  const { data, isPending, isError, isFetching, refetch } =
    api.notifications.list.useQuery(
      { limit: 50 },
      {
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
    );

  useEffect(() => {
    if (open) void refetch();
  }, [open, refetch]);

  const markReadMutation = api.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
    onError: (error) =>
      toast.error(
        `Could not mark notification as read: ${parseTRPCError(error)}`,
      ),
  });
  const markAllReadMutation = api.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
    onError: (error) =>
      toast.error(
        `Could not mark all notifications as read: ${parseTRPCError(error)}`,
      ),
  });
  const isMarkingRead =
    markReadMutation.isPending || markAllReadMutation.isPending;
  const notifications = (data?.items ?? []).filter(
    (notification) => !dismissedIds.includes(notification.id),
  );

  const counts = {
    all: notifications.length,
    unread: data?.unreadCount ?? 0,
    system: notifications.filter(
      (notification) => notification.module_id === null,
    ).length,
  };

  const visibleNotifications = notifications.filter((notification) => {
    if (filter === "unread") return notification.marked_at === null;
    if (filter === "system") return notification.module_id === null;
    return true;
  });

  const markRead = (id?: string) => {
    if (isMarkingRead) return;
    if (id !== undefined) {
      markReadMutation.mutate({ id });
    } else {
      markAllReadMutation.mutate();
    }
  };

  const dismiss = (id: string) => {
    if (isMarkingRead) return;
    const hide = () => setDismissedIds((current) => [...current, id]);
    if (
      notifications.some(
        (notification) =>
          notification.id === id && notification.marked_at === null,
      )
    ) {
      markReadMutation.mutate({ id }, { onSuccess: hide });
    } else {
      hide();
    }
  };

  return {
    filter,
    setFilter,
    counts,
    visibleNotifications,
    markRead,
    dismiss,
    isLoading: isPending,
    hasError: isError,
    isRefreshing: isFetching,
    isMarkingRead,
    isAtLimit: data?.items.length === 50,
    refresh: () => {
      void refetch();
    },
  };
}
