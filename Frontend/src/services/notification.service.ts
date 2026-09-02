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

export class NotificationService {
  /**
   * Fetch real notifications from Supabase via backend API with robust persistence.
   */
  static async getNotifications(): Promise<NotificationItem[]> {
    let records: NotificationItem[] = [];

    // Check local storage persistent log first
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("quantumx_notifications");
      if (local) {
        try {
          records = JSON.parse(local);
        } catch {
          records = [];
        }
      }
    }

    try {
      const response = await apiClient.get<NotificationItem[]>("/notifications");
      if (response.data && response.data.length > 0) {
        const mapped = response.data.map((n) => ({
          ...n,
          time: n.createdAt
            ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
          actionLabel: n.actionUrl ? "View Details" : undefined,
        }));

        // Merge backend records with local storage without duplicates
        const existingIds = new Set(records.map((r) => r.id));
        mapped.forEach((m) => {
          if (!existingIds.has(m.id)) {
            records.push(m);
          }
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("quantumx_notifications", JSON.stringify(records));
        }
      }
    } catch {
      // Offline fallback: returns local records
    }

    return records;
  }

  /**
   * Create a new notification in Supabase.
   */
  static async createNotification(payload: {
    id?: string;
    title: string;
    category?: string;
    message: string;
    actionUrl?: string;
  }): Promise<NotificationItem> {
    try {
      const response = await apiClient.post<NotificationItem>("/notifications", payload);
      const saved = {
        ...response.data,
        time: "Just now",
      };
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("quantumx_notifications");
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem("quantumx_notifications", JSON.stringify([saved, ...list].slice(0, 20)));
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
        const local = localStorage.getItem("quantumx_notifications");
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem("quantumx_notifications", JSON.stringify([fallback, ...list].slice(0, 20)));
      }
      return fallback;
    }
  }

  /**
   * Mark a notification as read in Supabase.
   */
  static async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {}
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("quantumx_notifications");
      if (local) {
        const list = JSON.parse(local) as NotificationItem[];
        localStorage.setItem(
          "quantumx_notifications",
          JSON.stringify(list.map((n) => (n.id === id ? { ...n, read: true } : n)))
        );
      }
    }
  }

  /**
   * Mark all notifications as read in Supabase.
   */
  static async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch("/notifications/read-all");
    } catch {}
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("quantumx_notifications");
      if (local) {
        const list = JSON.parse(local) as NotificationItem[];
        localStorage.setItem(
          "quantumx_notifications",
          JSON.stringify(list.map((n) => ({ ...n, read: true })))
        );
      }
    }
  }

  /**
   * Delete a notification from Supabase.
   */
  static async deleteNotification(id: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch {}
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("quantumx_notifications");
      if (local) {
        const list = JSON.parse(local) as NotificationItem[];
        localStorage.setItem(
          "quantumx_notifications",
          JSON.stringify(list.filter((n) => n.id !== id))
        );
      }
    }
  }

  /**
   * Clear all notifications for user from Supabase.
   */
  static async clearAll(): Promise<void> {
    try {
      await apiClient.delete("/notifications");
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("quantumx_notifications");
    }
  }
}
