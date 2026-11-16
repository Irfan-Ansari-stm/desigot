"use client";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { useNotifications, useMarkAllAsRead, useMarkAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { useUnreadCount } from "@/hooks/useMarketplace";
import {
  X,
  Bell,
  CheckCheck,
  ShoppingBag,
  Star,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Trash2,
  ExternalLink
} from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import Link from "next/link";

const typeIcon: Record<string, React.ReactNode> = {
  new_order: <ShoppingBag className="h-4 w-4 text-emerald-500" />,
  order_completed: <ShoppingBag className="h-4 w-4 text-emerald-500" />,
  review_received: <Star className="h-4 w-4 text-amber-500" />,
  payout_processed: <DollarSign className="h-4 w-4 text-emerald-500" />,
  payout_failed: <DollarSign className="h-4 w-4 text-rose-500" />,
  dispute_resolved: <AlertCircle className="h-4 w-4 text-blue-500" />,
  order_disputed: <AlertCircle className="h-4 w-4 text-rose-500" />,
  milestone_submitted: <CheckCheck className="h-4 w-4 text-indigo-500" />,
  message_received: <MessageSquare className="h-4 w-4 text-purple-500" />,
  system_alert: <Bell className="h-4 w-4 text-rose-500" />,
};

export function NotificationsPanel() {
  const router = useRouter();
  const { notificationsPanelOpen, toggleNotificationsPanel } = useUIStore();
  const { data } = useNotifications();
  const { data: unreadData, refetch: refetchUnread } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();
  const markAsRead = useMarkAsRead();
  const deleteNotif = useDeleteNotification();

  const notifications = data?.data || [];
  const unread = unreadData?.unread_count ?? (data as any)?.pagination?.unread_count ?? 0;

  if (!notificationsPanelOpen) return null;

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      markAsRead.mutate(n.id, {
        onSuccess: () => refetchUnread(),
      });
    }
    toggleNotificationsPanel();
    if (n.action_url) {
      router.push(n.action_url);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" onClick={toggleNotificationsPanel} />
      <div className="fixed right-3 sm:right-6 top-16 z-50 w-[92vw] max-w-sm sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-800" />
            <span className="font-bold text-sm text-slate-900">Notifications</span>
            {unread > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                type="button"
                onClick={() =>
                  markAllAsRead.mutate(undefined, {
                    onSuccess: () => refetchUnread(),
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={toggleNotificationsPanel}
              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Bell className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-800">All caught up!</p>
              <p className="text-xs text-slate-400 mt-0.5">No notifications right now.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group relative",
                  !n.is_read ? "bg-rose-50/20" : ""
                )}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-white transition-colors border border-slate-200/60">
                  {typeIcon[n.type] || <Bell className="h-4 w-4 text-slate-500" />}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-xs font-bold text-slate-900 leading-snug truncate">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {/* Status Dot / Delete */}
                <div className="absolute right-3 top-3.5 flex items-center gap-1">
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotif.mutate(n.id, {
                        onSuccess: () => refetchUnread(),
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-opacity"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Link
            href="/account/settings"
            onClick={toggleNotificationsPanel}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Preferences
          </Link>
          <Link
            href="/notifications"
            onClick={toggleNotificationsPanel}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            View all <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </>
  );
}
