"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { Search, UserX, UserCheck, Star, Shield } from "lucide-react";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole]     = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, role, status],
    queryFn: () => apiGet<{ data: User[]; pagination: { total: number; totalPages: number } }>(
      `/users/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${role ? `&role=${role}` : ""}${status ? `&status=${status}` : ""}`
    ),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => apiPatch(`/users/admin/users/${id}/status`, { status: s }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setSelected(null); toast.success("User status updated"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const users = (data as { data: User[]; pagination: { total: number; totalPages: number } } | undefined);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">User Management</h1>
        <p className="text-sm text-ink-secondary">{users?.pagination?.total || 0} users</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-secondary/60" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <Select options={[{ value: "", label: "All Roles" }, { value: "buyer", label: "Buyers" }, { value: "seller", label: "Sellers" }, { value: "admin", label: "Admins" }]}
          value={role} onChange={setRole} className="w-36" />
        <Select options={[{ value: "", label: "All Status" }, { value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }, { value: "banned", label: "Banned" }]}
          value={status} onChange={setStatus} className="w-36" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          <Card padding="none">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-border">
                <tr>{["User", "Role", "Status", "Sales", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(users?.data || []).map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar_url} name={u.display_name} size="sm" verified={u.seller_verified} />
                        <div>
                          <p className="font-medium text-ink-primary">{u.display_name}</p>
                          <p className="text-xs text-ink-secondary">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge color={u.role === "admin" ? "brand" : "default"} size="sm" className="capitalize">{u.role}</Badge></td>
                    <td className="px-4 py-3"><StatusBadge status={u.account_status} /></td>
                    <td className="px-4 py-3 text-ink-60">{u.total_sales || 0}</td>
                    <td className="px-4 py-3 text-ink-60 whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.account_status === "active" ? (
                          <Button variant="ghost" size="icon" title="Suspend" className="text-warning hover:bg-orange-50"
                            onClick={() => updateStatus.mutate({ id: u.id, s: "suspended" })}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="Activate" className="text-success hover:bg-green-50"
                            onClick={() => updateStatus.mutate({ id: u.id, s: "active" })}>
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {u.role === "seller" && (
                          <Button variant="ghost" size="icon" title="View seller details" onClick={() => setSelected(u)}>
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={page} totalPages={users?.pagination?.totalPages || 1} onPageChange={setPage} className="mt-4" />
        </>
      )}

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Seller Details" size="md"
          footer={<>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            {selected.account_status === "active" ? (
              <Button variant="danger" onClick={() => updateStatus.mutate({ id: selected.id, s: "suspended" })}>Suspend Seller</Button>
            ) : (
              <Button variant="primary" onClick={() => updateStatus.mutate({ id: selected.id, s: "active" })}>Activate Seller</Button>
            )}
          </>}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={selected.avatar_url} name={selected.display_name} size="lg" verified={selected.seller_verified} />
              <div>
                <p className="font-bold text-ink-primary text-lg">{selected.display_name}</p>
                <p className="text-sm text-ink-secondary">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Total Sales",   value: selected.total_sales || 0 },
                { label: "Avg. Rating",   value: selected.avg_seller_rating ? `${parseFloat(selected.avg_seller_rating as unknown as string)?.toFixed(1)} ⭐` : "—" },
                { label: "Reviews",       value: selected.seller_review_count || 0 },
                { label: "Response Rate", value: selected.response_rate ? `${Math.round(parseFloat(selected.response_rate as unknown as string) * 100)}%` : "—" },
                { label: "Seller Type",   value: selected.seller_type || "—" },
                { label: "KYC Verified",  value: selected.seller_verified ? "✓ Verified" : "Pending" },
              ].map((item) => (
                <div key={item.label} className="bg-surface-50 rounded-lg p-3">
                  <p className="text-xs text-ink-secondary">{item.label}</p>
                  <p className="font-semibold text-ink-primary mt-0.5">{String(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
