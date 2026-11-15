"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  Folder,
  Layers,
  Palette,
  Code,
  Layout,
  Smartphone,
  Globe,
  Briefcase,
  Video,
  Music,
  Camera,
  Compass,
  Box,
  GraduationCap,
  Award,
  ShoppingCart,
  CreditCard,
  Users,
  Activity,
  Heart,
  Grid,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";

interface CategoryIcon {
  id: string;
  name: string;
  icon_type: string;
  icon_ref: string;
  file_format: string;
  dimensions: string;
  status: string;
}

export default function CategoryIconsPage() {
  const [icons, setIcons] = useState<CategoryIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newRef, setNewRef] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchIcons = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories/icons");
      if (res.data?.success) {
        setIcons(res.data.data.icons || []);
      }
    } catch (err) {
      console.error("Failed to load icons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIcons();
  }, []);

  const handleRegisterIcon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRef.trim()) return;

    try {
      await api.post("/admin/categories/icons", {
        name: newName.trim(),
        icon_type: "library",
        icon_ref: newRef.trim(),
      });
      setNewName("");
      setNewRef("");
      setIsAdding(false);
      fetchIcons();
    } catch (err) {
      console.error("Register icon failed:", err);
    }
  };

  const filtered = icons.filter(
    (ic) =>
      ic.name?.toLowerCase().includes(search.toLowerCase()) ||
      ic.icon_ref?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Category Icons Library</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {icons.length} Icons
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Standardized vector and symbol glyphs assigned to category badges, homepage navigation, and marketplace cards
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchIcons}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Icons"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Icon</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleRegisterIcon} className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center gap-3">
          <input
            type="text"
            required
            placeholder="Display Name (e.g. Brain Logic)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
          />
          <input
            type="text"
            required
            placeholder="Lucide Icon Ref (e.g. Brain, Cpu)"
            value={newRef}
            onChange={(e) => setNewRef(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
          >
            Save Icon
          </button>
        </form>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons by name or reference glyph..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Icons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No matching icons found</p>
          </div>
        ) : (
          filtered.map((icon) => (
            <div
              key={icon.id}
              className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col items-center text-center justify-between shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Folder className="w-6 h-6" />
              </div>
              <div className="w-full">
                <div className="font-bold text-white text-xs truncate">{icon.name}</div>
                <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate">{icon.icon_ref}</div>
              </div>
              <span className="mt-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {icon.dimensions || "24x24"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
