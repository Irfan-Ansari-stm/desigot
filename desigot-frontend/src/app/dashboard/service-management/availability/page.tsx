"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, RefreshCw, Moon, Check, Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";

export default function ServiceAvailabilityPage() {
  const [schedule, setSchedule] = useState<any>({
    timezone: "UTC",
    weekly_schedule: {
      mon: { active: true, start: "09:00", end: "17:00" },
      tue: { active: true, start: "09:00", end: "17:00" },
      wed: { active: true, start: "09:00", end: "17:00" },
      thu: { active: true, start: "09:00", end: "17:00" },
      fri: { active: true, start: "09:00", end: "17:00" },
      sat: { active: false },
      sun: { active: false },
    },
    vacation_mode: false,
    vacation_message: "On annual design retreat, accepting advance reservations.",
    max_active_orders: 5,
    booking_notice_days: 1,
    max_advance_days: 60,
    expected_response_hours: 4,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load current user's availability or first seller's availability
      const userRes = await apiGet<any>("/auth/me").catch(() => null);
      const sellerId = userRes?.id || "e3b0c442-98fc-1c14-9afb-4c8996fb9242";
      const data = await apiGet<any>(`/admin/services/availability/${sellerId}`);
      if (data) setSchedule(data);
    } catch (err) {
      console.error("Failed to load availability:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const userRes = await apiGet<any>("/auth/me").catch(() => null);
      const sellerId = userRes?.id || "e3b0c442-98fc-1c14-9afb-4c8996fb9242";
      await apiPut(`/admin/services/availability/${sellerId}`, schedule);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const days = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Service Availability & Scheduling</h1>
            <p className="text-sm text-slate-400">
              Configure weekly delivery capacity, operating office hours, and vacation mode pauses.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Schedule"}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> Availability configuration successfully persisted.
        </div>
      )}

      {/* Vacation Mode Toggle Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Vacation & Away Mode</h3>
              <p className="text-xs text-slate-400">
                Temporarily pause new order bookings without unpublishing listings.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.vacation_mode}
              onChange={(e) =>
                setSchedule({ ...schedule, vacation_mode: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {schedule.vacation_mode && (
          <div className="pt-4 border-t border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Out-of-Office Client Notice
            </label>
            <input
              type="text"
              value={schedule.vacation_message || ""}
              onChange={(e) =>
                setSchedule({ ...schedule, vacation_message: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Weekly Schedule Matrix */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white text-base">Weekly Working Hours</h3>
            <p className="text-xs text-slate-400">Set active booking days and business hours.</p>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Timezone: {schedule.timezone}
          </div>
        </div>

        <div className="space-y-3">
          {days.map((d) => {
            const dayConfig = schedule.weekly_schedule?.[d.key] || { active: false };

            return (
              <div
                key={d.key}
                className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-32">
                  <input
                    type="checkbox"
                    checked={dayConfig.active}
                    onChange={(e) => {
                      const updated = {
                        ...schedule.weekly_schedule,
                        [d.key]: {
                          ...dayConfig,
                          active: e.target.checked,
                          start: dayConfig.start || "09:00",
                          end: dayConfig.end || "17:00",
                        },
                      };
                      setSchedule({ ...schedule, weekly_schedule: updated });
                    }}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-xs text-white">{d.label}</span>
                </div>

                {dayConfig.active ? (
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="time"
                      value={dayConfig.start || "09:00"}
                      onChange={(e) => {
                        const updated = {
                          ...schedule.weekly_schedule,
                          [d.key]: { ...dayConfig, start: e.target.value },
                        };
                        setSchedule({ ...schedule, weekly_schedule: updated });
                      }}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="time"
                      value={dayConfig.end || "17:00"}
                      onChange={(e) => {
                        const updated = {
                          ...schedule.weekly_schedule,
                          [d.key]: { ...dayConfig, end: e.target.value },
                        };
                        setSchedule({ ...schedule, weekly_schedule: updated });
                      }}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Closed / Day Off
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
