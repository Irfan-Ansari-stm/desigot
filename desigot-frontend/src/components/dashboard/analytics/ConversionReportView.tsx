"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Percent, Smartphone, Monitor, Globe, Filter, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export function ConversionReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/admin/analytics/conversion")
      .then(setData)
      .catch((err) => console.error("Failed to load conversion report:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading conversion funnel analytics...</div>;
  }

  const funnel = data?.funnel || [];
  const devices = data?.devices || [];
  const trafficSources = data?.trafficSources || [];

  return (
    <div className="space-y-6">
      {/* Funnel Overview Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Percent className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            7-Stage Full-Funnel Marketplace Conversion
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tracking buyer progression from anonymous visitor to verified purchase completion
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase font-semibold">End-to-End Conversion Rate</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {data?.overallConversionRate || 0}%
          </div>
        </div>
      </div>

      {/* 7 Interactive Stage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {funnel.map((stg: any, i: number) => {
          const isFirst = i === 0;
          const isLast = i === funnel.length - 1;

          return (
            <div
              key={stg.stage}
              className={`rounded-2xl p-4 border transition-all ${
                isLast
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase">Stage {i + 1}</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                {stg.label.split(". ")[1] || stg.label}
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {Number(stg.count).toLocaleString()}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>Conv:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stg.conversionRatePct}%</span>
              </div>
              {!isFirst && (
                <div className="text-[11px] text-rose-500 flex justify-between mt-1">
                  <span>Drop-off:</span>
                  <span className="font-semibold">-{stg.dropOffPct}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Device & Traffic Sources Grid (2 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-blue-500" />
            Conversion Performance by Device Category
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Device</th>
                  <th className="px-3 py-2 text-center">Sessions</th>
                  <th className="px-3 py-2 text-center">Purchases</th>
                  <th className="px-3 py-2 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {devices.map((d: any) => {
                  const rate = d.sessions > 0 ? ((d.purchases / d.sessions) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={d.device_type}>
                      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{d.device_type}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">{d.sessions}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-indigo-600 dark:text-indigo-400">{d.purchases}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic Source Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Traffic Channel Acquisition Velocity
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Traffic Channel</th>
                  <th className="px-3 py-2 text-center">Traffic Volume</th>
                  <th className="px-3 py-2 text-center">Completed Sales</th>
                  <th className="px-3 py-2 text-right">Channel Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trafficSources.map((t: any) => {
                  const rate = t.sessions > 0 ? ((t.purchases / t.sessions) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={t.traffic_source}>
                      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{t.traffic_source}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">{t.sessions}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-indigo-600 dark:text-indigo-400">{t.purchases}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
