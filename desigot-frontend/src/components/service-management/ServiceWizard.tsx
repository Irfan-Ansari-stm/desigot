"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  DollarSign,
  Package,
  Plus,
  Trash2,
  Image as ImageIcon,
  HelpCircle,
  Tag,
  Search,
  Eye,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  parent_id?: string;
}

interface ServiceTag {
  id: string;
  name: string;
}

export function ServiceWizard({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<ServiceTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category_id: initialData?.category_id || "",
    short_description: initialData?.short_description || "",
    description: initialData?.description || "",
    target_audience: initialData?.target_audience || "SaaS Startups, Web Agencies, Product Designers",
    language: initialData?.language || "English",
    starting_price_cents: initialData?.starting_price_cents || 5000,
    delivery_time_days: initialData?.delivery_time_days || 3,
    revision_limit: initialData?.revision_limit || 2,
    packages: initialData?.packages || [
      {
        package_type: "basic",
        name: "Basic Tier",
        description: "Essential deliverables and initial concepts",
        price_cents: 5000,
        delivery_days: 3,
        revisions: 1,
        features: ["Source files included", "Commercial license"],
      },
      {
        package_type: "standard",
        name: "Standard Tier",
        description: "Complete design suite with revisions",
        price_cents: 12000,
        delivery_days: 5,
        revisions: 3,
        features: ["Source files included", "Commercial license", "Interactive prototype", "Priority support"],
      },
      {
        package_type: "premium",
        name: "Premium Enterprise",
        description: "Comprehensive end-to-end design system & consultation",
        price_cents: 25000,
        delivery_days: 7,
        revisions: 5,
        features: ["Source files included", "Commercial license", "Interactive prototype", "Priority support", "Live 1-on-1 walkthrough"],
      },
    ],
    addons: initialData?.addons || [
      { name: "Extra Fast 24h Delivery", description: "Rush delivery expedited priority", price_cents: 3000, delivery_days_added: 0 },
      { name: "Additional Revision Round", description: "Extra iteration round", price_cents: 1500, delivery_days_added: 1 },
    ],
    media: initialData?.media || [
      {
        file_url: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
        caption: "Main Service Presentation",
        is_primary: true,
      },
    ],
    what_is_included: initialData?.what_is_included || ["High fidelity Figma designs", "Design tokens", "Developer documentation"],
    what_is_not_included: initialData?.what_is_not_included || ["Custom frontend coding"],
    deliverables: initialData?.deliverables || [".fig file", "SVG/PNG assets export"],
    customer_requirements: initialData?.customer_requirements || "Please provide brand guidelines, logo assets, and brief target market specifications.",
    faqs: initialData?.faqs || [
      { q: "What format will the final designs be in?", a: "All deliverables are provided in native Figma files with organized layers, auto-layout, and exported SVG/PNG assets." },
    ],
    seo_title: initialData?.seo_title || "",
    seo_description: initialData?.seo_description || "",
    seo_keywords: initialData?.seo_keywords || ["ui design", "ux design", "figma", "web design"],
    tag_ids: initialData?.tag_ids || [],
  });

  useEffect(() => {
    // Load categories and tags
    apiGet<Category[]>("/admin/services/categories")
      .then((res) => {
        if (Array.isArray(res)) setCategories(res);
      })
      .catch(() => {});

    apiGet<ServiceTag[]>("/admin/services/tags")
      .then((res) => {
        if (Array.isArray(res)) setAvailableTags(res);
      })
      .catch(() => {});
  }, []);

  const steps = [
    { num: 1, title: "Basic Info", desc: "Title & Category" },
    { num: 2, title: "Pricing", desc: "Base terms" },
    { num: 3, title: "Packages", desc: "Tiers & Features" },
    { num: 4, title: "Add-ons", desc: "Upgrades" },
    { num: 5, title: "Media", desc: "Images & Visuals" },
    { num: 6, title: "Deliverables", desc: "Scope & FAQs" },
    { num: 7, title: "SEO & Tags", desc: "Search discovery" },
    { num: 8, title: "Review", desc: "Finalize & Publish" },
  ];

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setErrorMsg("Please enter a service title (min 5 characters)");
        return;
      }
      if (!formData.category_id) {
        setErrorMsg("Please select a service category");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(8, prev + 1));
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (targetStatus: "draft" | "pending_approval" | "published") => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
      };

      await apiPost("/admin/services", payload);
      router.push("/dashboard/service-management/all");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || "Failed to create service");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Stepper Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {steps.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`text-left p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-indigo-600/20 border border-indigo-500/50"
                    : isCompleted
                    ? "bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800"
                    : "opacity-40 hover:opacity-75"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? "text-indigo-300" : "text-slate-300"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate hidden md:block">
                  {s.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wizard Form Surfaces */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl min-h-[460px]">
        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">1. Basic Information</h2>
              <p className="text-sm text-slate-400 mt-1">
                Provide clear, descriptive naming and classification for your custom design service.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Service Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Complete SaaS Dashboard & Mobile UI/UX Design in Figma"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="e.g. Seed-stage Tech Startups, Enterprise Teams"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Short Summary (1-2 sentences)
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief summary for catalog cards and search previews..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Full Detailed Description
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the entire design process, research methods, tool stack, and value proposition..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: PRICING & DELIVERY */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">2. Base Pricing & Delivery Terms</h2>
              <p className="text-sm text-slate-400 mt-1">
                Set minimum starting threshold, baseline turnaround time, and revision rounds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Starting Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.starting_price_cents / 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        starting_price_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold text-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Minimum client entry tier</p>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Delivery Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.delivery_time_days}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_time_days: parseInt(e.target.value || "1", 10) })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold text-lg focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500">Standard working days</p>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Included Revisions
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.revision_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, revision_limit: parseInt(e.target.value || "0", 10) })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold text-lg focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500">Revision rounds included</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PACKAGES */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">3. Service Package Tiers</h2>
              <p className="text-sm text-slate-400 mt-1">
                Configure tiered packages (Basic, Standard, Premium) with distinct deliverables and pricing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formData.packages.map((pkg: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {pkg.package_type}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      ${(pkg.price_cents / 100).toFixed(0)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                      Tier Name
                    </label>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => {
                        const updated = [...formData.packages];
                        updated[idx].name = e.target.value;
                        setFormData({ ...formData, packages: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={pkg.price_cents / 100}
                      onChange={(e) => {
                        const updated = [...formData.packages];
                        updated[idx].price_cents = Math.round(parseFloat(e.target.value || "0") * 100);
                        setFormData({ ...formData, packages: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Days
                      </label>
                      <input
                        type="number"
                        value={pkg.delivery_days}
                        onChange={(e) => {
                          const updated = [...formData.packages];
                          updated[idx].delivery_days = parseInt(e.target.value || "1", 10);
                          setFormData({ ...formData, packages: updated });
                        }}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Revisions
                      </label>
                      <input
                        type="number"
                        value={pkg.revisions}
                        onChange={(e) => {
                          const updated = [...formData.packages];
                          updated[idx].revisions = parseInt(e.target.value || "0", 10);
                          setFormData({ ...formData, packages: updated });
                        }}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                      Features (Comma-separated)
                    </label>
                    <textarea
                      rows={2}
                      value={pkg.features.join(", ")}
                      onChange={(e) => {
                        const updated = [...formData.packages];
                        updated[idx].features = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        setFormData({ ...formData, packages: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: ADD-ONS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">4. Extra Add-ons & Upgrades</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Offer optional upsells (rush delivery, source files, extra consultation).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    addons: [
                      ...formData.addons,
                      { name: "New Add-on", description: "Deliverable description", price_cents: 2000, delivery_days_added: 0 },
                    ],
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Add-on
              </button>
            </div>

            <div className="space-y-3">
              {formData.addons.map((addon: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 items-center"
                >
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={addon.name}
                      onChange={(e) => {
                        const updated = [...formData.addons];
                        updated[idx].name = e.target.value;
                        setFormData({ ...formData, addons: updated });
                      }}
                      placeholder="Add-on title..."
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="5"
                      value={addon.price_cents / 100}
                      onChange={(e) => {
                        const updated = [...formData.addons];
                        updated[idx].price_cents = Math.round(parseFloat(e.target.value || "0") * 100);
                        setFormData({ ...formData, addons: updated });
                      }}
                      placeholder="Price ($)"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">+{addon.delivery_days_added} days</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.addons.filter((_: any, i: number) => i !== idx);
                        setFormData({ ...formData, addons: updated });
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: MEDIA */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">5. Media & Portfolio Presentations</h2>
              <p className="text-sm text-slate-400 mt-1">
                Attach high-resolution hero images and visual gallery presentations.
              </p>
            </div>

            <div className="space-y-4">
              {formData.media.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4"
                >
                  <img
                    src={m.file_url}
                    alt={m.caption || "Preview"}
                    className="w-20 h-20 object-cover rounded-lg border border-slate-700 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={m.file_url}
                      onChange={(e) => {
                        const updated = [...formData.media];
                        updated[idx].file_url = e.target.value;
                        setFormData({ ...formData, media: updated });
                      }}
                      placeholder="Image URL..."
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={m.caption || ""}
                      onChange={(e) => {
                        const updated = [...formData.media];
                        updated[idx].caption = e.target.value;
                        setFormData({ ...formData, media: updated });
                      }}
                      placeholder="Caption / description..."
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Primary Hero
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: DELIVERABLES & FAQS */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">6. Deliverables, Scope & Client Requirements</h2>
              <p className="text-sm text-slate-400 mt-1">
                Clearly define boundaries, what is delivered, and what the customer must supply.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                What is Included (one per line)
              </label>
              <textarea
                rows={3}
                value={formData.what_is_included.join("\n")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    what_is_included: e.target.value.split("\n").filter(Boolean),
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Customer Instructions & Requirements
              </label>
              <textarea
                rows={3}
                value={formData.customer_requirements}
                onChange={(e) =>
                  setFormData({ ...formData, customer_requirements: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 7: SEO & TAGS */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">7. SEO Metadata & Marketplace Tags</h2>
              <p className="text-sm text-slate-400 mt-1">
                Optimize search indexability and select relevant design catalog tags.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={formData.seo_title || formData.title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Marketplace Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-slate-900 border border-slate-800 rounded-xl">
                {availableTags.map((tag) => {
                  const isSelected = formData.tag_ids.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? formData.tag_ids.filter((id: string) => id !== tag.id)
                          : [...formData.tag_ids, tag.id];
                        setFormData({ ...formData, tag_ids: updated });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW & PUBLISH */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">8. Review & Final Confirmation</h2>
              <p className="text-sm text-slate-400 mt-1">
                Verify all information before submitting to the moderation queue or publishing live.
              </p>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{formData.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{formData.short_description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-indigo-400">
                    ${(formData.starting_price_cents / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">{formData.delivery_time_days} days turnaround</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Packages</span>
                  <span className="font-semibold text-slate-200">{formData.packages.length} Tiers</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Add-ons</span>
                  <span className="font-semibold text-slate-200">{formData.addons.length} Extras</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Revisions</span>
                  <span className="font-semibold text-slate-200">{formData.revision_limit} Rounds</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned Tags</span>
                  <span className="font-semibold text-slate-200">{formData.tag_ids.length} Tags</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit("draft")}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save as Draft
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit("pending_approval")}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit for Review
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit("published")}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <CheckCircle2 className="w-4 h-4" /> Direct Publish (Super Admin)
              </button>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        {currentStep < 8 && (
          <div className="flex items-center justify-between pt-8 border-t border-slate-800 mt-8">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
