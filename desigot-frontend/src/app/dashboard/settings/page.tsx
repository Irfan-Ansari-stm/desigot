"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useNotifications";
import { apiPatch, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { User, Bell, Lock, Shield, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = ["Profile", "Notifications", "Security", "2FA"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("Profile");
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-ink-primary">Settings</h1><p className="text-sm text-ink-secondary">Manage your account preferences</p></div>
      <div className="flex gap-6 flex-col lg:flex-row">
        <aside className="lg:w-48 shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {sections.map((s) => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  activeSection === s ? "bg-brand text-white" : "text-ink-60 hover:bg-surface-100")}>
                {s === "Profile" && <User className="h-4 w-4" />}
                {s === "Notifications" && <Bell className="h-4 w-4" />}
                {s === "Security" && <Lock className="h-4 w-4" />}
                {s === "2FA" && <Shield className="h-4 w-4" />}
                {s}
              </button>
            ))}
          </nav>
        </aside>
        <div className="flex-1">
          {activeSection === "Profile"       && <ProfileSection />}
          {activeSection === "Notifications" && <NotificationsSection />}
          {activeSection === "Security"      && <SecuritySection />}
          {activeSection === "2FA"           && <TwoFASection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user, setUser } = useAuthStore();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { display_name: user?.display_name || "", username: user?.username || "", bio: user?.bio || "" },
  });
  const onSubmit = async (data: Record<string, string>) => {
    try {
      const updated = await apiPatch("/users/me", data);
      setUser({ ...user!, ...(updated as object) });
      toast.success("Profile updated");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };
  return (
    <Card><h2 className="text-base font-semibold text-ink-primary mb-4">Profile Information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Display Name" {...register("display_name")} />
        <Input label="Username" prefix="@" placeholder="yourhandle" {...register("username")} />
        <div>
          <label className="block text-sm font-medium text-ink-primary mb-1.5">Bio</label>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" rows={4} {...register("bio")} />
        </div>
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </form>
    </Card>
  );
}

function NotificationsSection() {
  const { data: prefs } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const prefList = prefs as { event_type: string; email_enabled: boolean; in_app_enabled: boolean }[] | undefined;

  const EVENT_LABELS: Record<string, string> = {
    new_order: "New Order", order_completed: "Order Completed", review_received: "Review Received",
    payout_processed: "Payout Processed", payout_failed: "Payout Failed",
    dispute_resolved: "Dispute Resolved", message_received: "New Message",
    listing_approved: "Listing Approved", listing_rejected: "Listing Rejected",
  };

  return (
    <Card><h2 className="text-base font-semibold text-ink-primary mb-4">Notification Preferences</h2>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-ink-secondary mb-2 px-2">
          <span>Event</span><span className="text-center">Email</span><span className="text-center">In-App</span>
        </div>
        {Object.entries(EVENT_LABELS).map(([type, label]) => {
          const pref = prefList?.find((p) => p.event_type === type);
          return (
            <div key={type} className="grid grid-cols-3 gap-4 items-center px-2 py-2 hover:bg-surface-50 rounded-lg">
              <span className="text-sm text-ink-primary">{label}</span>
              <div className="flex justify-center">
                <input type="checkbox" defaultChecked={pref?.email_enabled ?? true} className="rounded" />
              </div>
              <div className="flex justify-center">
                <input type="checkbox" defaultChecked={pref?.in_app_enabled ?? true} className="rounded" />
              </div>
            </div>
          );
        })}
        <Button variant="primary" size="sm" className="mt-2">Save Preferences</Button>
      </div>
    </Card>
  );
}

function SecuritySection() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ current_password: string; new_password: string; confirm: string }>();
  const onSubmit = async (data: { current_password: string; new_password: string }) => {
    try {
      await apiPost("/auth/change-password", { current_password: data.current_password, new_password: data.new_password });
      toast.success("Password changed. All sessions revoked.");
      reset();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };
  return (
    <Card><h2 className="text-base font-semibold text-ink-primary mb-4 flex items-center gap-2"><Lock className="h-4 w-4" />Change Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Current Password" type="password" {...register("current_password", { required: true })} />
        <Input label="New Password" type="password" helperText="Min 8 chars, 1 uppercase, 1 number" {...register("new_password", { required: true })} />
        <Input label="Confirm New Password" type="password" {...register("confirm", { required: true })} />
        <Button type="submit" loading={isSubmitting} leftIcon={<Key className="h-4 w-4" />}>Update Password</Button>
      </form>
    </Card>
  );
}

function TwoFASection() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    try {
      const data = await apiPost<{ qrCodeUrl: string }>("/auth/2fa/setup");
      setQrCode(data.qrCodeUrl);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirm = async () => {
    setLoading(true);
    try {
      await apiPost("/auth/2fa/confirm", { totp_code: totpCode });
      toast.success("2FA enabled successfully!");
      setQrCode(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Card><h2 className="text-base font-semibold text-ink-primary mb-2 flex items-center gap-2"><Shield className="h-4 w-4" />Two-Factor Authentication</h2>
      <p className="text-sm text-ink-secondary mb-4">Add an extra layer of security to your account using an authenticator app.</p>
      {!qrCode ? (
        <Button onClick={startSetup} leftIcon={<Shield className="h-4 w-4" />}>Enable 2FA</Button>
      ) : (
        <div className="space-y-4">
          <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl border border-border" />
          <p className="text-sm text-ink-secondary">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          <Input label="Verification Code" placeholder="Enter 6-digit code" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} wrapperClassName="w-48" />
          <Button onClick={confirm} loading={loading}>Confirm & Enable 2FA</Button>
        </div>
      )}
    </Card>
  );
}
