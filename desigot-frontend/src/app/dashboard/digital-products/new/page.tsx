"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackagePlus, Sparkles } from "lucide-react";
import { DigitalProductWizard } from "@/components/digital-products/DigitalProductWizard";
import { apiGet } from "@/lib/api";

export default function AddDigitalProductPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiGet<any>("/categories")
      .then((res) => {
        const items = res?.data || (Array.isArray(res) ? res : []);
        setCategories(items);
      })
      .catch((err) => console.error("Could not fetch categories:", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/digital-products/all"
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Add Digital Product</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                9-Step Wizard
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Create, package, price, and distribute a new digital asset to the Desigot marketplace.
            </p>
          </div>
        </div>
      </div>

      {/* 9-Step Wizard */}
      <DigitalProductWizard categories={categories} />
    </div>
  );
}
