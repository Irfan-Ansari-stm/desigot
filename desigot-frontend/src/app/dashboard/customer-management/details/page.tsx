"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Search, ArrowRight, Loader2, Users } from "lucide-react";
import { apiGet } from "@/lib/api";

export default function CustomerDetailsRedirectPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFirstCustomer() {
      try {
        const res = await apiGet<any>("/admin/customers", { limit: 10 });
        const list = res?.customers || res?.data?.customers || [];
        setCustomers(list);
        if (list.length > 0) {
          // If customer list exists, automatically route to the first customer after a brief moment
          router.replace(`/dashboard/customer-management/${list[0].id}`);
        }
      } catch (err) {
        console.error("Failed to load customer list for redirect", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFirstCustomer();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-[#0B1120]/80 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Loading Customer Details...</h2>
        <p className="text-xs text-slate-400 mb-6">
          Redirecting to the central customer relationship 360° management console.
        </p>

        {customers.length > 0 && (
          <div className="text-left space-y-2 mt-4 border-t border-slate-800 pt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Customer Directly:
            </span>
            {customers.slice(0, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/customer-management/${c.id}`)}
                className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-xs text-white transition group"
              >
                <div className="truncate">
                  <div className="font-medium group-hover:text-purple-400 transition">
                    {c.name || c.display_name || c.email}
                  </div>
                  <div className="text-[10px] text-slate-500">{c.email}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
