"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle2,
  Cpu,
  Activity,
  Sparkles,
  Trash2,
  Check,
  Inbox,
  Filter,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import HelpTooltip from "@/components/common/HelpTooltip";

interface NotificationItem {
  id: string;
  title: string;
  category: "system" | "benchmark" | "disease";
  time: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "system" | "disease">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("quantumx_notifications");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }
  }, []);

  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("quantumx_notifications", JSON.stringify(updated));
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "system") return n.category === "system";
    if (filter === "disease") return n.category === "disease" || n.category === "benchmark";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5 pb-12 w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-quantum font-semibold">
              Updates &amp; Alerts
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Stay informed on quantum computing hardware state, model accuracy updates, and screening reports.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-3 py-1.5 rounded-lg border border-hairline bg-parchment hover:bg-cream text-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check size={13} /> Mark All as Read
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="px-3 py-1.5 rounded-lg border border-hairline bg-parchment hover:bg-red-50 text-ink-soft hover:text-red-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-cream-deep/60 rounded-xl border border-hairline text-xs font-sans w-fit">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
            filter === "all"
              ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
            filter === "unread"
              ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("system")}
          className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
            filter === "system"
              ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          System Alerts
        </button>
        <button
          type="button"
          onClick={() => setFilter("disease")}
          className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
            filter === "disease"
              ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Medical Models
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-parchment border border-hairline shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cream-deep/60 border border-hairline text-ink-soft mx-auto flex items-center justify-center">
            <Inbox size={22} />
          </div>
          <h3 className="font-serif text-lg font-medium text-ink">
            No notifications in this category
          </h3>
          <p className="text-xs text-ink-soft font-light max-w-sm mx-auto">
            You're all caught up! New system calibrations and screening reports will be announced here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.read
                    ? "bg-parchment/70 border-hairline"
                    : "bg-parchment border-quantum/40 shadow-xs ring-1 ring-quantum/20"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.category === "system"
                        ? "bg-quantum/10 text-quantum"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {notif.category === "system" ? <Cpu size={18} /> : <Sparkles size={18} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-sm sm:text-base font-medium text-ink">
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-quantum shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ink-soft font-light leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-ink-soft/70 font-mono block pt-0.5">
                      {notif.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.actionUrl && (
                    <Link
                      href={notif.actionUrl}
                      className="text-xs font-semibold text-quantum hover:underline flex items-center gap-1"
                    >
                      {notif.actionLabel || "View"} <ArrowRight size={12} />
                    </Link>
                  )}
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notif.id)}
                      className="p-1.5 rounded-lg hover:bg-cream border border-hairline text-ink-soft hover:text-ink transition-colors cursor-pointer text-xs"
                      title="Mark as read"
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 border border-hairline text-ink-soft hover:text-red-700 transition-colors cursor-pointer text-xs"
                    title="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
