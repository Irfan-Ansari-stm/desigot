"use client";
import { useState } from "react";
import { useMySubscription, usePlans, useSubscribeToPlan, useCancelSubscription, usePayoutMethods } from "@/hooks/useOrders";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { CheckCircle2, Crown, Zap, Building2, Briefcase, Plus, Trash2 } from "lucide-react";
import { apiPost, apiDelete } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { SellerPlan } from "@/types";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:       <Briefcase className="h-5 w-5" />,
  pro:        <Zap className="h-5 w-5" />,
  agency:     <Building2 className="h-5 w-5" />,
  enterprise: <Crown className="h-5 w-5" />,
};

const PLAN_COLORS: Record<string, string> = {
  free:       "from-surface-100 to-surface-50 border-border",
  pro:        "from-blue-50 to-white border-blue-200",
  agency:     "from-purple-50 to-white border-purple-200",
  enterprise: "from-orange-50 to-white border-orange-200",
};

export default function SellerSettingsPage() {
  const qc                    = useQueryClient();
  const { data: subscription } = useMySubscription();
  const { data: plans }       = usePlans();
  const { data: methods }     = usePayoutMethods();
  const subscribeTo           = useSubscribeToPlan();
  const cancelSub             = useCancelSubscription();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [addMethodModal, setAddMethodModal] = useState(false);
  const [methodType, setMethodType]         = useState("stripe_connect");
  const [displayName, setDisplayName]       = useState("");
  const [stripeAccount, setStripeAccount]   = useState("");
  const [paypalEmail, setPaypalEmail]       = useState("");

  const planList  = plans  as SellerPlan[]  | undefined || [];
  const methodList = methods as { id: string; method_type: string; display_name: string; is_default: boolean; is_verified: boolean }[] | undefined || [];
  const currentSub = subscription as { plan_name?: string; status?: string; current_period_end?: string; display_name?: string; commission_rate?: number } | null | undefined;

  const handleSubscribe = async (planId: string) => {
    try {
      await subscribeTo.mutateAsync({ planId, billingCycle: billing });
      toast.success("Subscription activated!");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll stay on the current plan until period end.")) return;
    try {
      await cancelSub.mutateAsync();
      toast.success("Subscription cancelled");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleAddMethod = async () => {
    try {
      await apiPost("/payments/payout-methods", {
        method_type: methodType,
        display_name: displayName,
        stripe_account_id: methodType === "stripe_connect" ? stripeAccount : undefined,
        paypal_email: methodType === "paypal" ? paypalEmail : undefined,
        is_default: methodList.length === 0,
      });
      qc.invalidateQueries({ queryKey: ["payout-methods"] });
      setAddMethodModal(false);
      toast.success("Payout method added");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      await apiDelete(`/payments/payout-methods/${id}`);
      qc.invalidateQueries({ queryKey: ["payout-methods"] });
      toast.success("Payout method removed");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-ink-primary">Seller Settings</h1><p className="text-sm text-ink-secondary">Manage your plan, payout methods, and preferences</p></div>

      {/* Current plan */}
      {currentSub && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink-primary">Current Plan</h2>
            <Badge color={currentSub.status === "active" ? "success" : "warning"}>{currentSub.status}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
              {PLAN_ICONS[currentSub.plan_name || "free"]}
            </div>
            <div>
              <p className="font-semibold text-ink-primary">{currentSub.display_name || "Free Plan"}</p>
              <p className="text-xs text-ink-secondary">{currentSub.commission_rate ? `${(currentSub.commission_rate * 100).toFixed(0)}% commission` : ""}{currentSub.current_period_end ? ` · Renews ${new Date(currentSub.current_period_end).toLocaleDateString()}` : ""}</p>
            </div>
          </div>
          {currentSub.status === "active" && currentSub.plan_name !== "free" && (
            <Button variant="ghost" size="sm" className="mt-3 text-danger hover:bg-red-50" onClick={handleCancel}>
              Cancel Subscription
            </Button>
          )}
        </Card>
      )}

      {/* Plan selector */}
      <div id="plan">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-primary">Choose a Plan</h2>
          <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
            {(["monthly", "yearly"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
                  billing === b ? "bg-white shadow-sm text-ink-primary" : "text-ink-secondary")}>
                {b} {b === "yearly" && <span className="text-success ml-1">-15%</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {planList.map((plan) => {
            const isCurrent = currentSub?.plan_name === plan.name;
            const price = billing === "yearly" && plan.price_yearly_cents
              ? plan.price_yearly_cents / 12
              : plan.price_monthly_cents;
            return (
              <div key={plan.id} className={cn(
                "relative border rounded-2xl p-5 bg-gradient-to-b transition-all hover:shadow-md",
                PLAN_COLORS[plan.name],
                isCurrent && "ring-2 ring-accent"
              )}>
                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    Current
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-brand">{PLAN_ICONS[plan.name]}</div>
                  <span className="font-bold text-ink-primary capitalize">{plan.name}</span>
                </div>
                <div className="mb-4">
                  {price === 0 ? (
                    <span className="text-2xl font-black text-ink-primary">Free</span>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-ink-primary">{formatPrice(price)}</span>
                      <span className="text-xs text-ink-secondary">/mo</span>
                    </div>
                  )}
                  <p className="text-xs text-ink-secondary mt-1">{(plan.commission_rate * 100).toFixed(0)}% commission</p>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {[
                    plan.max_active_listings ? `${plan.max_active_listings} listings` : "Unlimited listings",
                    `${plan.search_boost_pct}% search boost`,
                    ...(plan.has_ai_optimizer ? ["AI listing optimizer"] : []),
                    ...(plan.has_api_access ? ["API access"] : []),
                    ...(plan.has_dedicated_cxm ? ["Dedicated CXM"] : []),
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-1.5 text-xs text-ink-60">
                      <CheckCircle2 className="h-3 w-3 text-success shrink-0" />{feat}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <Button variant={plan.name === "free" ? "secondary" : "accent"} size="sm" fullWidth
                    loading={subscribeTo.isPending} onClick={() => handleSubscribe(plan.id)}>
                    {plan.price_monthly_cents === 0 ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payout methods */}
      <div id="payout-methods">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-primary">Payout Methods</h2>
          <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddMethodModal(true)}>
            Add Method
          </Button>
        </div>
        {methodList.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-ink-secondary mb-3">No payout methods added yet</p>
            <Button variant="accent" size="sm" onClick={() => setAddMethodModal(true)}>Add Payout Method</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {methodList.map((m) => (
              <Card key={m.id} padding="sm" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-ink-secondary uppercase">{m.method_type.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-primary">{m.display_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.is_default && <Badge size="sm" color="success">Default</Badge>}
                      {m.is_verified && <Badge size="sm" color="info">Verified</Badge>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-danger hover:bg-red-50"
                  onClick={() => { if (confirm("Remove this payout method?")) handleDeleteMethod(m.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add payout method modal */}
      <Modal open={addMethodModal} onClose={() => setAddMethodModal(false)} title="Add Payout Method" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setAddMethodModal(false)}>Cancel</Button>
          <Button variant="accent" onClick={handleAddMethod}>Add Method</Button>
        </>}>
        <div className="space-y-4">
          <Select label="Method Type" options={[
            { value: "stripe_connect", label: "Stripe Connect" },
            { value: "paypal",         label: "PayPal" },
            { value: "bank_transfer",  label: "Bank Transfer" },
          ]} value={methodType} onChange={setMethodType} />
          <Input label="Display Name" placeholder='e.g. "Stripe Account (••••1234)"'
            value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          {methodType === "stripe_connect" && (
            <Input label="Stripe Account ID" placeholder="acct_xxxxxxxxxxxx"
              value={stripeAccount} onChange={(e) => setStripeAccount(e.target.value)} />
          )}
          {methodType === "paypal" && (
            <Input label="PayPal Email" type="email" placeholder="paypal@example.com"
              value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
          )}
        </div>
      </Modal>
    </div>
  );
}
