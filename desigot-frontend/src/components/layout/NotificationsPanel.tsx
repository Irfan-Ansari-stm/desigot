"use client";
import { useUIStore } from "@/store/ui.store";
import { useNotifications, useMarkAllAsRead, useMarkAsRead } from "@/hooks/useNotifications";
import { X, Bell, CheckCheck, ShoppingBag, Star, AlertCircle, DollarSign, MessageSquare } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const typeIcon: Record<string, React.ReactNode> = {
  new_order:            <ShoppingBag className="h-4 w-4 text-success" />,
  order_completed:      <ShoppingBag className="h-4 w-4 text-success" />,
  review_received:      <Star className="h-4 w-4 text-warning" />,
  payout_processed:     <DollarSign className="h-4 w-4 text-success" />,
  payout_failed:        <DollarSign className="h-4 w-4 text-danger" />,
  dispute_resolved:     <AlertCircle className="h-4 w-4 text-info" />,
  order_disputed:       <AlertCircle className="h-4 w-4 text-danger" />,
  milestone_submitted:  <CheckCheck className="h-4 w-4 text-info" />,
  message_received:     <MessageSquare className="h-4 w-4 text-accent2" />,
};

export function NotificationsPanel() {
  const { notificationsPanelOpen, toggleNotificationsPanel } = useUIStore();
  const { data } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();
  const markAsRead    = useMarkAsRead();

  const notifications = data?.data || [];
  const unread = (data as unknown as { unread_count?: number })?.unread_count || 0;

  if (!notificationsPanelOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={toggleNotificationsPanel} />
      <div className="fixed right-4 top-20 z-50 w-96 bg-white border border-border rounded-2xl shadow-xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-ink-primary" />
            <span className="font-semibold text-sm text-ink-primary">Notifications</span>
            {unread > 0 && (
              <span className="bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="text-xs text-accent hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
            <button onClick={toggleNotificationsPanel} className="p-1 rounded hover:bg-surface-50">
              <X className="h-4 w-4 text-ink-secondary" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-border mx-auto mb-2" />
              <p className="text-sm text-ink-secondary">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 hover:bg-surface-50 cursor-pointer transition-colors",
                  !n.is_read && "bg-accent/[0.03]"
                )}
                onClick={() => {
                  if (!n.is_read) markAsRead.mutate(n.id);
                  if (n.action_url) window.location.href = n.action_url;
                }}
              >
                <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  {typeIcon[n.type] || <Bell className="h-4 w-4 text-ink-secondary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary leading-snug">{n.title}</p>
                  <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-ink-secondary/60 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 bg-accent rounded-full mt-1.5 shrink-0" />}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-border">
          <Link
            href="/dashboard/settings#notifications"
            onClick={toggleNotificationsPanel}
            className="text-sm text-accent hover:underline font-medium"
          >
            Notification settings →
          </Link>
        </div>
      </div>
    </>
  );
}
