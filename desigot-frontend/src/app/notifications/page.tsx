"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Shield,
  Star,
  Sparkles,
} from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: notificationsData, isLoading } = useNotifications(unreadOnly);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unread_count || 0;

  const handleMarkAll = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification.mutateAsync(id);
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to remove notification");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_order":
      case "order_completed":
        return <ShoppingBag className="h-4 w-4 text-emerald-600" />;
      case "payment_succeeded":
      case "payment_received":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "message_received":
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case "review_received":
        return <Star className="h-4 w-4 text-amber-500" />;
      case "security_alert":
        return <Shield className="h-4 w-4 text-rose-600" />;
      default:
        return <Bell className="h-4 w-4 text-brand" />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-ink-primary">Notifications</h1>
                {unreadCount > 0 && (
                  <Badge color="danger" size="sm">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="text-sm text-ink-secondary mt-0.5">
                Real-time updates regarding your purchases, milestones, reviews, and security.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                unreadOnly
                  ? "bg-brand text-white"
                  : "bg-white border border-border text-ink-secondary hover:bg-surface-100"
              }`}
            >
              {unreadOnly ? "Showing Unread" : "Filter Unread"}
            </button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAll}
                loading={markAllAsRead.isPending}
                className="flex items-center gap-1.5"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-ink-tertiary">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-ink-primary text-base mb-1">All caught up!</h3>
            <p className="text-xs text-ink-secondary">
              You do not have any {unreadOnly ? "unread " : ""}notifications right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                onClick={() => {
                  if (!notif.read_at) {
                    markAsRead.mutate(notif.id);
                  }
                  if (notif.action_url) {
                    router.push(notif.action_url);
                  }
                }}
                className={`p-4 sm:p-5 transition-all cursor-pointer flex items-start gap-4 ${
                  !notif.read_at
                    ? "bg-white border-brand/30 shadow-xs"
                    : "bg-surface-50/70 border-border opacity-85"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-sm ${!notif.read_at ? "font-bold text-ink-primary" : "font-medium text-ink-secondary"}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[11px] text-ink-tertiary whitespace-nowrap">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {notif.body}
                  </p>
                </div>

                <div className="flex items-center gap-1 self-center">
                  {!notif.read_at && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead.mutate(notif.id);
                      }}
                      className="p-1.5 text-ink-tertiary hover:text-brand rounded-lg hover:bg-surface-100 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="p-1.5 text-ink-tertiary hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
