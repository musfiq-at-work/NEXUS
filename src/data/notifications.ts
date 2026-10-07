import type { Notification } from "~/types/notification";

type DummyNotification = Pick<
  Notification,
  "title" | "body" | "event_type" | "module_id" | "module_name" | "target_id"
> & { minutesAgo: number; is_marked: boolean };

// Local samples only. No notification API or database calls are made.
const dummyNotifications: DummyNotification[] = [
  {
    title: "Changes saved",
    body: "Your sales contract changes have been saved successfully.",
    event_type: "SUCCESS",
    module_id: 1,
    module_name: "Commercial",
    target_id: "SC-2026-0142",
    minutesAgo: 5,
    is_marked: false,
  },
  {
    title: "Shipment deadline approaching",
    body: "The shipment for order FO-2026-0087 is due in two days. Please review the pending tasks with your team.",
    event_type: "WARNING",
    module_id: 2,
    module_name: "Merchandising",
    target_id: "FO-2026-0087",
    minutesAgo: 18,
    is_marked: false,
  },
  {
    title: "Report generation failed",
    body: "The export report could not be generated. Please check the report details and try again.",
    event_type: "ERROR",
    module_id: 1,
    module_name: "Commercial",
    target_id: null,
    minutesAgo: 42,
    is_marked: false,
  },
  {
    title: "Scheduled maintenance",
    body: "A maintenance window is planned for tonight. Save any ongoing work before leaving for the day.",
    event_type: "INFO",
    module_id: null,
    module_name: null,
    target_id: null,
    minutesAgo: 65,
    is_marked: false,
  },
  {
    title: "Payment recorded",
    body: "The latest payment has been recorded against invoice INV-2026-0036.",
    event_type: "SUCCESS",
    module_id: 3,
    module_name: "Accounting",
    target_id: "INV-2026-0036",
    minutesAgo: 120,
    is_marked: false,
  },
  {
    title: "System update available",
    body: "New improvements are available in RDL Nexus. Your current work will be kept when you refresh the page.",
    event_type: "INFO",
    module_id: null,
    module_name: null,
    target_id: null,
    minutesAgo: 1440,
    is_marked: true,
  },
];

export function createDummyNotifications(now = new Date()): Notification[] {
  return dummyNotifications.map(({ minutesAgo, ...notification }, index) => {
    const added_at = new Date(now.getTime() - minutesAgo * 60_000);

    return {
      ...notification,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      recipient_id: "00000000-0000-4000-8000-000000000000",
      added_at,
      marked_at: notification.is_marked ? added_at : null,
    };
  });
}
