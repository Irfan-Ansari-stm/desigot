"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Package, RefreshCw, CheckCircle2, Clock, DollarSign, Layers } from "lucide-react";
import { apiGet } from "@/lib/api";

interface PackageItem {
  id: string;
  service_id: string;
  package_type: string;
  name: string;
  description: string;
  price_cents: number;
  price_usd: string;
  delivery_days: number;
  revisions: number;
  service_title: string;
  service_slug: string;
  seller_name: string;
  features: { id: string; feature_name: string; is_included: boolean }[];
}

export default function ServicePackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/packages");
      const list = Array.isArray(data) ? data : data?.packages || data?.data || [];
      setPackages(list);
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Service Packages Directory</h1>
            <p className="text-sm text-slate-400">
              Overview of all active tiered packages (Basic, Standard, Premium) across all marketplace services.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid of Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading packages...</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {pkg.package_type}
                  </span>
                  <span className="text-lg font-bold text-white">${pkg.price_usd}</span>
                </div>

                <h3 className="font-bold text-white text-base mt-2">{pkg.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{pkg.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800/80 mt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {pkg.delivery_days} days delivery
                  </span>
                  <span>{pkg.revisions} revision{pkg.revisions !== 1 ? "s" : ""}</span>
                </div>

                {pkg.features?.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-800/80 mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Included Scope
                    </span>
                    <div className="space-y-1">
                      {pkg.features.slice(0, 4).map((f) => (
                        <div key={f.id} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{f.feature_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <Link
                  href={`/dashboard/service-management/${pkg.service_id}`}
                  className="font-medium text-indigo-400 hover:text-indigo-300 truncate max-w-[200px]"
                >
                  {pkg.service_title}
                </Link>
                <span className="text-slate-500 text-[11px]">{pkg.seller_name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
