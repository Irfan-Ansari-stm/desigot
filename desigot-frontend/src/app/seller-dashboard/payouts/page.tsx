"use client";
import { useState } from "react";
import { useSellerBalance, usePayouts, usePayoutMethods, useRequestPayout } from "@/hooks/useOrders";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { DollarSign, Clock, TrendingUp, Plus, ArrowDownToLine } from "lucide-react";
import type { Payout } from "@/types";

export default function PayoutsPage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const { data: balance }  = useSellerBalance();
  const { data: payouts }  = usePayouts();
  const { data: methods }  = usePayoutMethods();
  const requestPayout      = useRequestPayout();
  const payoutList = (payouts as { data: Payout[] } | undefined)?.data || [];
  const methodList = (methods as { id: string; method_type: string; display_name: string }[] | undefined) || [];

  const handleRequestPayout = async () => {
    if (!selectedMethod || !payoutAmount) { toast.error("Fill in all fields"); return; }
    const cents = parseInt(payoutAmount) * 100;
    if (cents < 5000) { toast.error("Minimum payout is $50.00"); return; }
    try {
      await requestPayout.mutateAsync({ methodId: selectedMethod, amountCents: cents });
      toast.success("Payout requested! Processing in 2 business days.");
      setShowPayoutModal(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-primary">Payouts</h1><p className="text-sm text-ink-secondary">Manage your earnings and withdrawals</p></div>
        <Button variant="accent" leftIcon={<ArrowDownToLine className="h-4 w-4" />} onClick={() => setShowPayoutModal(true)}>
          Request Payout
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Available Balance" value={formatPrice(balance?.available_cents || 0)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Pending (in escrow)" value={formatPrice(balance?.pending_escrow_cents || 0)} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Lifetime Earned" value={formatPrice(balance?.lifetime_earned_cents || 0)} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {/* Payout history */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-primary">Payout History</h2>
          <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => window.location.href = "/dashboard/settings#payout-methods"}>
            Add Method
          </Button>
        </div>
        {payoutList.length === 0 ? (
          <EmptyState icon={<DollarSign className="h-8 w-8" />} title="No payouts yet"
            description="Your payout history will appear here after your first withdrawal." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-border">
                <tr>{["Date", "Method", "Amount", "Status", "Processed"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payoutList.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-ink-60">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-ink-primary">{p.display_name || p.method_type}</td>
                    <td className="px-4 py-3 font-semibold text-ink-primary">{formatPrice(p.amount_cents)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-ink-60">{p.processed_at ? formatDate(p.processed_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Request payout modal */}
      <Modal open={showPayoutModal} onClose={() => setShowPayoutModal(false)} title="Request Payout"
        description={`Available: ${formatPrice(balance?.available_cents || 0)} · Minimum: $50.00`}
        footer={<>
          <Button variant="secondary" onClick={() => setShowPayoutModal(false)}>Cancel</Button>
          <Button variant="accent" loading={requestPayout.isPending} onClick={handleRequestPayout}>Request Payout</Button>
        </>}>
        <div className="space-y-4">
          <Select label="Payout Method"
            options={methodList.length ? methodList.map((m) => ({ value: m.id, label: m.display_name })) : [{ value: "", label: "No payout methods added" }]}
            value={selectedMethod} onChange={setSelectedMethod} />
          <Input label="Amount (USD)" type="number" min="50" max={((balance?.available_cents || 0) / 100).toString()}
            placeholder="50.00" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)}
            prefix="$" helperText="Min $50.00" />
          {methodList.length === 0 && (
            <p className="text-xs text-warning bg-orange-50 p-3 rounded-lg">
              You need to add a payout method first. Go to Settings → Payout Methods.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
