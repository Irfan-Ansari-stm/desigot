"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Image as ImageIcon,
  FileText,
  Upload,
  DollarSign,
  Cpu,
  Tag,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { apiPost } from "@/lib/api";

const STEPS = [
  { id: 1, name: "Basic Info", icon: Layers },
  { id: 2, name: "Media & Previews", icon: ImageIcon },
  { id: 3, name: "Description", icon: FileText },
  { id: 4, name: "Files & Storage", icon: Upload },
  { id: 5, name: "Licenses & Pricing", icon: DollarSign },
  { id: 6, name: "Compatibility", icon: Cpu },
  { id: 7, name: "Tags & SEO", icon: Tag },
  { id: 8, name: "Documentation", icon: HelpCircle },
  { id: 9, name: "Review & Publish", icon: CheckCircle },
];

export function DigitalProductWizard({ categories = [] }: { categories?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category_id: categories[0]?.id || "",
    version: "1.0.0",
    short_description: "",
    description: "",
    thumbnail_url: "",
    preview_images: ["", ""],
    demo_url: "",
    documentation_url: "",
    included_assets: ["1,000+ UI Components", "Responsive Layout Grids", "WCAG AAA Color Tokens"],
    newAssetInput: "",
    files: [
      { file_name: "main-design-bundle.fig", file_size_bytes: 14500000, file_format: ".fig", mime_type: "application/octet-stream", is_primary: true }
    ],
    price_personal: 29,
    price_commercial: 79,
    price_extended: 199,
    price_enterprise: 499,
    software_compatibility: ["Figma", "Framer", "React"],
    softwareInput: "",
    file_formats: [".fig", ".svg", ".zip"],
    formatInput: "",
    tags: ["ui-kit", "design-system", "figma", "dark-mode"],
    tagInput: "",
    changelog: "Initial public release with comprehensive component library.",
    status: "published" as "draft" | "pending_review" | "published",
    is_featured: false,
  });

  const handleNext = () => {
    if (currentStep === 1 && !formData.title.trim()) {
      setErrorMessage("Product title is required.");
      return;
    }
    setErrorMessage("");
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrev = () => {
    setErrorMessage("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const addIncludedAsset = () => {
    if (formData.newAssetInput.trim()) {
      setFormData({
        ...formData,
        included_assets: [...formData.included_assets, formData.newAssetInput.trim()],
        newAssetInput: "",
      });
    }
  };

  const removeIncludedAsset = (index: number) => {
    setFormData({
      ...formData,
      included_assets: formData.included_assets.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: "",
      });
    }
  };

  const removeTag = (t: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((item) => item !== t),
    });
  };

  const handleSubmit = async (submitStatus: "draft" | "pending_review" | "published") => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const payload = {
        title: formData.title.trim(),
        category_id: formData.category_id || null,
        version: formData.version.trim() || "1.0.0",
        short_description: formData.short_description.trim(),
        description: formData.description.trim() || formData.short_description.trim() || "Professional digital product.",
        thumbnail_url: formData.thumbnail_url.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        preview_images: formData.preview_images.filter((img) => img.trim().length > 0),
        demo_url: formData.demo_url.trim() || null,
        documentation_url: formData.documentation_url.trim() || null,
        included_assets: formData.included_assets,
        files: formData.files,
        price_personal_cents: Math.round(Number(formData.price_personal) * 100),
        price_commercial_cents: Math.round(Number(formData.price_commercial) * 100),
        price_extended_cents: Math.round(Number(formData.price_extended) * 100),
        price_enterprise_cents: Math.round(Number(formData.price_enterprise) * 100),
        software_compatibility: formData.software_compatibility,
        file_formats: formData.file_formats,
        tags: formData.tags,
        changelog: formData.changelog,
        status: submitStatus,
        is_featured: formData.is_featured,
      };

      const res = await apiPost<any>("/admin/digital-products", payload);
      const newId = res?.id || res?.data?.id;
      router.push(`/dashboard/digital-products/${newId || "all"}`);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to create digital product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Wizard Steps Header */}
      <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.id)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400"
                        : isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className={`text-xs font-semibold ${isActive ? "text-indigo-400" : isCompleted ? "text-slate-300" : "text-slate-500"}`}>
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-500">Step {s.id}</p>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${isCompleted ? "bg-emerald-500/40" : "bg-slate-800"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Wizard Body Card */}
      <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-8 shadow-xl min-h-[460px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 1: Basic Information</h3>
                <p className="text-sm text-slate-400">Establish the master name, version, and primary category of the product.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Apex Enterprise Design System & UI Kit"
                    className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Marketplace Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="">UI Kits & Design Systems</option>
                        <option value="">Mobile App Templates</option>
                        <option value="">3D Assets & Models</option>
                        <option value="">Dashboards & SaaS</option>
                        <option value="">Icons & Illustrations</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Semantic Version
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0.0"
                    className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Short Summary (Elevator Pitch)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="e.g. Modern responsive Figma UI kit featuring 800+ components, auto-layout 5.0, and dark mode tokens for enterprise apps."
                    className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Media & Previews */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 2: Media & Previews</h3>
                <p className="text-sm text-slate-400">High-resolution cover visuals and live demo URLs for marketplace showcase.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Cover Thumbnail URL (16:9 or 4:3)
                  </label>
                  <input
                    type="text"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Gallery Preview Image 1
                    </label>
                    <input
                      type="text"
                      value={formData.preview_images[0] || ""}
                      onChange={(e) => {
                        const next = [...formData.preview_images];
                        next[0] = e.target.value;
                        setFormData({ ...formData, preview_images: next });
                      }}
                      placeholder="https://..."
                      className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Gallery Preview Image 2
                    </label>
                    <input
                      type="text"
                      value={formData.preview_images[1] || ""}
                      onChange={(e) => {
                        const next = [...formData.preview_images];
                        next[1] = e.target.value;
                        setFormData({ ...formData, preview_images: next });
                      }}
                      placeholder="https://..."
                      className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Live Demo / Figma Community Link
                  </label>
                  <input
                    type="text"
                    value={formData.demo_url}
                    onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                    placeholder="https://figma.com/@your-profile/file-id"
                    className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Description & Included Assets */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 3: Description & Highlights</h3>
                <p className="text-sm text-slate-400">Detailed product features and deliverables list.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Product Description
                </label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your design asset in full detail: architecture, design token compatibility, responsiveness, typography choices..."
                  className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  What&apos;s Included In The Package
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={formData.newAssetInput}
                    onChange={(e) => setFormData({ ...formData, newAssetInput: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIncludedAsset())}
                    placeholder="e.g. 50+ Responsive Page Layouts"
                    className="flex-1 bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addIncludedAsset}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.included_assets.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-sm text-slate-200">
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => removeIncludedAsset(idx)}
                        className="text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Files & Storage */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 4: Files & Secure Vault Storage</h3>
                <p className="text-sm text-slate-400">Attach primary distribution files and secure downloads.</p>
              </div>

              <div className="p-8 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/40 text-center">
                <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1">Upload Source Package (.fig, .zip, .sketch, .blend)</h4>
                <p className="text-xs text-slate-400 mb-4">Maximum file size 2.5 GB. Protected by SHA-256 virus scanning.</p>
                <div className="flex justify-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-indigo-300">
                    Vault Enclave: s3://desigot-vault-prod/products
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configured Deliverables</h4>
                {formData.files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#121c2d] border border-slate-700/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                        {f.file_format}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{f.file_name}</p>
                        <p className="text-xs text-slate-400">{(f.file_size_bytes / 1024 / 1024).toFixed(1)} MB • Primary Package</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ready to Distribute
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Licenses & Pricing */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 5: Licenses & Pricing Architecture</h3>
                <p className="text-sm text-slate-400">Configure prices across the 4 standard commercial tiers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-[#121c2d] border border-slate-700/80">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-white">Personal License</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">1 Project</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Non-commercial, portfolio, or hobby projects.</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={formData.price_personal}
                      onChange={(e) => setFormData({ ...formData, price_personal: Number(e.target.value) })}
                      className="w-full bg-[#0a101d] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#121c2d] border border-indigo-500/40 shadow-lg shadow-indigo-500/5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-white">Commercial License</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">Recommended</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Single client deliverable or commercial product.</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={formData.price_commercial}
                      onChange={(e) => setFormData({ ...formData, price_commercial: Number(e.target.value) })}
                      className="w-full bg-[#0a101d] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#121c2d] border border-slate-700/80">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-white">Extended Commercial</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">Unlimited Products</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">SaaS apps, resale templates, broadcast media.</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={formData.price_extended}
                      onChange={(e) => setFormData({ ...formData, price_extended: Number(e.target.value) })}
                      className="w-full bg-[#0a101d] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#121c2d] border border-slate-700/80">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-white">Enterprise Unlimited</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Corporate</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Full organization, unlimited seats, indemnity.</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={formData.price_enterprise}
                      onChange={(e) => setFormData({ ...formData, price_enterprise: Number(e.target.value) })}
                      className="w-full bg-[#0a101d] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Compatibility */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 6: Compatibility & Software</h3>
                <p className="text-sm text-slate-400">Specify design tools and code frameworks supported.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Software Supported
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Figma", "Framer", "Adobe XD", "Sketch", "Blender", "Cinema 4D", "Tailwind CSS", "React", "SwiftUI"].map((tool) => {
                    const isSelected = formData.software_compatibility.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, software_compatibility: formData.software_compatibility.filter((t) => t !== tool) });
                          } else {
                            setFormData({ ...formData, software_compatibility: [...formData.software_compatibility, tool] });
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                        }`}
                      >
                        {tool}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  File Formats Included
                </label>
                <div className="flex flex-wrap gap-2">
                  {[".fig", ".sketch", ".xd", ".blend", ".svg", ".zip", ".json", ".c4d"].map((fmt) => {
                    const isSelected = formData.file_formats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, file_formats: formData.file_formats.filter((f) => f !== fmt) });
                          } else {
                            setFormData({ ...formData, file_formats: [...formData.file_formats, fmt] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition ${
                          isSelected
                            ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                            : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                        }`}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Tags & Taxonomy */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 7: Search Tags & Discovery</h3>
                <p className="text-sm text-slate-400">Tag your product with targeted keywords for marketplace search indexing.</p>
              </div>

              <div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={formData.tagInput}
                    onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Type keyword and press Enter (e.g. neobrutalism, dark-mode, mobile-ui)"
                    className="flex-1 bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition"
                  >
                    Add Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-rose-400 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Feature on Marketplace Homepage & Category Top
                    </span>
                    <p className="text-xs text-slate-400">Grants priority placement in staff picks and hero banners.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 8: Documentation */}
          {currentStep === 8 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 8: Documentation & Changelog</h3>
                <p className="text-sm text-slate-400">Provide customer setup guides and release notes.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Documentation URL
                </label>
                <input
                  type="text"
                  value={formData.documentation_url}
                  onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                  placeholder="https://docs.yoursite.com"
                  className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Release Notes / Initial Changelog
                </label>
                <textarea
                  rows={4}
                  value={formData.changelog}
                  onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
                  className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 9: Review & Publish */}
          {currentStep === 9 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 9: Final Review & Publishing</h3>
                <p className="text-sm text-slate-400">Review all configured product parameters before committing to the database.</p>
              </div>

              <div className="bg-[#121c2d] border border-slate-700/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
                  <div>
                    <h4 className="text-base font-bold text-white">{formData.title || "Untitled Product"}</h4>
                    <p className="text-xs text-slate-400">v{formData.version} • {formData.software_compatibility.join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Personal License</p>
                    <p className="text-lg font-bold text-emerald-400 font-mono">${formData.price_personal}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Commercial</span>
                    <span className="font-semibold text-white font-mono">${formData.price_commercial}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Extended</span>
                    <span className="font-semibold text-white font-mono">${formData.price_extended}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Deliverables</span>
                    <span className="font-semibold text-white">{formData.files.length} file(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Featured</span>
                    <span className="font-semibold text-amber-400">{formData.is_featured ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleSubmit("draft")}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("pending_review")}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition shadow-lg shadow-amber-600/20"
                >
                  Submit for Moderation
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("published")}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Publish Immediately
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              currentStep === 1
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < STEPS.length && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
