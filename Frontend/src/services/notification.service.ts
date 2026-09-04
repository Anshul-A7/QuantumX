import { apiClient } from "@/lib/api";

export interface NotificationItem {
  id: string;
  title: string;
  category: "system" | "benchmark" | "disease";
  time?: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt?: string;
}

function getUserNotificationKey(): string {
  if (typeof window === "undefined") return "quantumx_user_notifications";
  const email = localStorage.getItem("quantumx_user_email") || "default";
  return `quantumx_notifications_${email}`;
}

export class NotificationService {
  /**
   * Synchronously returns cached user notifications for instant 0ms render.
   */
  static getCachedNotifications(): NotificationItem[] {
    if (typeof window === "undefined") return [];
    const storageKey = getUserNotificationKey();
    try {
      const local = localStorage.getItem(storageKey);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch real notifications strictly for the current authenticated user.
   * Leverages fast Stale-While-Revalidate pattern for instantaneous loading.
   */
  static async getNotifications(): Promise<NotificationItem[]> {
    const storageKey = getUserNotificationKey();
    const cached = NotificationService.getCachedNotifications();

    try {
      const response = await apiClient.get<NotificationItem[]>("/notifications", {
        timeout: 4500,
      });
      if (response.data && Array.isArray(response.data)) {
        const records = response.data.map((n) => ({
          ...n,
          time: n.createdAt
            ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
          actionLabel: n.actionUrl ? "View Details" : undefined,
        }));

        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(records));
        }
        return records;
      }
    } catch {
      return cached;
    }

    return cached;
  }

  /**
   * Create a new notification in database for the current user.
   */
  static async createNotification(payload: {
    id?: string;
    title: string;
    category?: string;
    message: string;
    actionUrl?: string;
  }): Promise<NotificationItem> {
    const storageKey = getUserNotificationKey();
    try {
      const response = await apiClient.post<NotificationItem>("/notifications", payload);
      const saved = {
        ...response.data,
        time: "Just now",
      };
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(storageKey);
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem(storageKey, JSON.stringify([saved, ...list].slice(0, 20)));
      }
      return saved;
    } catch {
      const fallback: NotificationItem = {
        id: payload.id || `notif-${Date.now()}`,
        title: payload.title,
        category: (payload.category as any) || "system",
        message: payload.message,
        read: false,
        actionUrl: payload.actionUrl,
        time: "Just now",
      };
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(storageKey);
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem(storageKey, JSON.stringify([fallback, ...list].slice(0, 20)));
      }
      return fallback;
    }
  }

  /**
   * Mark a notification as read.
   */
  static async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {}
    if (typeof window !== "undefined") {
      const storageKey = getUserNotificationKey();
      const local = localStorage.getItem(storageKey);
      if (local) {
        const list = JSON.parse(local) as NotificationItem[];
        localStorage.setItem(
          storageKey,
          JSON.stringify(list.map((n) => (n.id === id ? { ...n, read: true } : n)))
        );
      }
    }
  }

  /**
   * Mark all notifications as read.
   */
  static async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch("/notifications/read-all");
    } catch {}
    if (typeof window !== "undefined") {
      const storageKey = getUserNotificationKey();
      const local = localStorage.getItem(storageKey);
      if (local) {
        const list = JSON.parse(local) as NotificationItem[];
        localStorage.setItem(
          storageKey,
          JSON.stringify(list.map((n) => ({ ...n, read: true })))
        );
      }
    }
  }

  /**
   * Delete a notification.
   */
  static async deleteNotification(id: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch {}
    if (typeof window !== "undefined") {
      const storageKey = getUserNotificationKey();
      const local = localStorage.getItem(storageKey);
      if (local) {
        const list = JSON.parse(local) as NotificationItem[];
        localStorage.setItem(
          storageKey,
          JSON.stringify(list.filter((n) => n.id !== id))
        );
      }
    }
  }

  /**
   * Clear all notifications for user.
   */
  static async clearAll(): Promise<void> {
    try {
      await apiClient.delete("/notifications");
    } catch {}
    if (typeof window !== "undefined") {
      const storageKey = getUserNotificationKey();
      localStorage.removeItem(storageKey);
      localStorage.removeItem("quantumx_notifications");
    }
  }
}
