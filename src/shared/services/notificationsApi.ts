import { httpClient } from "@/shared/services/http/client";

export type NotificationType = "LEAD_MARKED_DEAD" | "APPLICATION_WITHDRAWN";

export type AppNotification = {
  id: string;
  notificationType: NotificationType;
  title: string;
  body?: string | null;
  actorName?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationPage = {
  content: AppNotification[];
  totalElements: number;
};

export const notificationsApi = {
  list: async (size = 20): Promise<AppNotification[]> => {
    const response = await httpClient.get<NotificationPage>("/notifications", {
      params: { page: 0, size },
    });
    return response.data.content ?? [];
  },

  /** Just the badge. Counts on the server rather than fetching rows to count them. */
  unreadCount: async (): Promise<number> => {
    const response = await httpClient.get<{ unread: number }>("/notifications/unread-count");
    return response.data.unread ?? 0;
  },

  markRead: async (id: string): Promise<void> => {
    await httpClient.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await httpClient.post("/notifications/read-all");
  },
};

/** Where a notification's row should take you when it is clicked. */
export function notificationLink(notification: AppNotification): string | null {
  if (!notification.entityId) return null;
  if (notification.entityType === "LEAD") return `/leads/${notification.entityId}`;
  if (notification.entityType === "APPLICATION") return `/applications/${notification.entityId}`;
  return null;
}
