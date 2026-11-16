"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { useAuthStore } from "@/store/auth.store";
import { useSellerOnboarding, useSaveSellerApplication, useSubmitSellerApplication } from "@/hooks/useMarketplace";
import {
  Briefcase,
  User,
  Building,
  Sparkles,
  ShieldCheck,
  FileCheck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Lock,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const STEPS = [
  { step: 1, title: "Personal Info", icon: User },
  { step: 2, title: "Business Details", icon: Building },
  { step: 3, title: "Creator Profile", icon: Sparkles },
  { step: 4, title: "Identity Verification", icon: ShieldCheck },
  { step: 5, title: "Agreements", icon: FileCheck },
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isSeller } = useAuthStore();
  const { data: onboardingData, isLoading: onboardingLoading, refetch } = useSellerOnboarding();
  const saveApp = useSaveSellerApplication();
  const submitApp = useSubmitSellerApplication();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    full_name: "",
    email: "",
    phone: "",
    // Step 2
    business_name: "",
    business_type: "individual",
    country: "United States",
    address: "",
    website: "",
    // Step 3
    avatar_url: "",
    cover_image_url: "",
    bio: "",
    skills: [] as string[],
    skill_input: "",
    years_of_experience: 3,
    portfolio_url: "",
    // Step 4
    id_document_type: "Passport",
    id_document_url: "",
    business_document_url: "",
    verification_consent: false,
    // Step 5
    agreed_terms: false,
    agreed_commission: false,
    agreed_guidelines: false,
  });

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Pre-fill user data & existing application
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.display_name || "",
        email: user.email || "",
      }));
    }

    if (onboardingData?.application) {
      const app = onboardingData.application;
      setFormData((prev) => ({
        ...prev,
        full_name: app.full_name || prev.full_name,
        email: app.email || prev.email,
        phone: app.phone || "",
        business_name: app.business_name || "",
        business_type: app.business_type || "individual",
        country: app.country || "United States",
        address: app.address || "",
        website: app.website || "",
        avatar_url: app.avatar_url || "",
        cover_image_url: app.cover_image_url || "",
        bio: app.bio || "",
        skills: Array.isArray(app.skills) ? app.skills : [],
        years_of_experience: app.years_of_experience || 3,
        portfolio_url: app.portfolio_url || "",
        id_document_type: app.id_document_type || "Passport",
        id_document_url: app.id_document_url || "",
        business_document_url: app.business_document_url || "",
        verification_consent: !!app.verification_consent,
        agreed_terms: !!app.agreed_terms,
        agreed_commission: !!app.agreed_commission,
        agreed_guidelines: !!app.agreed_guidelines,
      }));
      if (app.current_step && app.current_step >= 1 && app.current_step <= 5) {
        setStep(app.current_step);
      }
    }
  }, [user, onboardingData]);

  // Auth redirect check
  useEffect(() => {
    if (!onboardingLoading) {
      if (!isAuthenticated()) {
        router.push("/login?redirect=/seller/onboarding");
      } else if (isSeller()) {
        router.push("/seller/dashboard");
      }
    }
  }, [isAuthenticated, isSeller, onboardingLoading, router]);

  const handleNextStep = async () => {
    setFormError("");
    // Step validation
    if (step === 1) {
      if (!formData.full_name.trim() || !formData.email.trim()) {
        setFormError("Please fill in your legal full name and contact email.");
        return;
      }
    } else if (step === 2) {
      if (!formData.business_name.trim() || !formData.country.trim()) {
        setFormError("Please provide your business name and country.");
        return;
      }
    } else if (step === 3) {
      if (!formData.bio.trim()) {
        setFormError("Please write a short professional bio describing your specialty.");
        return;
      }
    } else if (step === 4) {
      if (!formData.verification_consent) {
        setFormError("Identity verification consent is required to sell on the marketplace.");
        return;
      }
    }

    // Auto-save draft application
    try {
      await saveApp.mutateAsync({
        id: onboardingData?.application?.id,
        data: {
          ...formData,
          current_step: Math.min(step + 1, 5),
        },
      });
      setStep((s) => Math.min(s + 1, 5));
    } catch (e: any) {
      setFormError(e.response?.data?.message || "Failed to save application step.");
    }
  };

  const handleSubmitApplication = async () => {
    setFormError("");
    if (!formData.agreed_terms || !formData.agreed_commission || !formData.agreed_guidelines) {
      setFormError("You must accept all marketplace agreements to submit your application.");
      return;
    }

    const appId = onboardingData?.application?.id;
    if (!appId) {
      setFormError("Application record not found. Please click Back and Save first.");
      return;
    }

    try {
      await submitApp.mutateAsync({
        id: appId,
        agreements: {
          agreed_terms: true,
          agreed_commission: true,
          agreed_guidelines: true,
        },
      });
      setSuccessMessage("Your seller application has been submitted and is currently pending administrator verification.");
      refetch();
    } catch (e: any) {
      setFormError(e.response?.data?.message || "Submission failed. Please check required fields.");
    }
  };

  const handleAddSkill = () => {
    if (formData.skill_input.trim()) {
      if (!formData.skills.includes(formData.skill_input.trim())) {
        setFormData({
          ...formData,
          skills: [...formData.skills, formData.skill_input.trim()],
          skill_input: "",
        });
      }
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const appStatus = onboardingData?.application?.status || "draft";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200/60 rounded-full px-3.5 py-1 text-xs font-bold text-rose-600">
            <Briefcase className="w-3.5 h-3.5" />
            Seller Onboarding & KYC Verification
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Apply to Become a Desigot Creator
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Sell digital design systems, templates, and offer bespoke client sprint services to hundreds of thousands of teams worldwide.
          </p>
        </div>

        {/* Existing Application Status Alert */}
        {appStatus === "pending" || appStatus === "submitted" || appStatus === "under_review" ? (
          <div className="bg-white border border-amber-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Application Under Administrative Review</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Thank you! Your seller application (#{onboardingData?.application?.id?.slice(0, 8)}) is currently in our verification queue. An administrator will review your portfolio and documents within 24-48 business hours.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Status: <span className="uppercase text-amber-600 font-extrabold">{appStatus}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            
            {/* Step Bar */}
            <div className="grid grid-cols-5 border-b border-slate-100 bg-slate-50/50">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isActive = step === s.step;
                const isPassed = step > s.step;
                return (
                  <div
                    key={s.step}
                    className={`py-4 px-2 text-center flex flex-col items-center justify-center gap-1.5 transition-colors ${
                      isActive ? "bg-white border-b-2 border-rose-500 text-rose-600 font-bold" : isPassed ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? "bg-rose-500 text-white"
                          : isPassed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : s.step}
                    </div>
                    <span className="text-[11px] hidden sm:block font-medium truncate max-w-full px-1">{s.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mx-6 mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mx-6 mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Content */}
            <div className="p-6 sm:p-10">
              
              {/* STEP 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 1: Personal Contact Information</h2>
                    <p className="text-xs text-slate-500">Provide legal contact details for contract and KYC verification.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="e.g. Alexander Vance"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Official Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alexander@studio.com"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (with Country Code)</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 019-2834"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Business Information */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 2: Business & Operation Details</h2>
                    <p className="text-xs text-slate-500">Specify your creator studio structure and physical jurisdiction.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Business / Brand Name *</label>
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        placeholder="e.g. Apex Visual Systems"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Entity Type</label>
                        <select
                          value={formData.business_type}
                          onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                        >
                          <option value="individual">Solo Creator / Freelancer</option>
                          <option value="agency">Design Agency / Studio</option>
                          <option value="corporation">Registered Corporation</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Country / Tax Territory *</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="e.g. United States, Germany, Japan"
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="100 Market St, Suite 400"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Studio Website / Portfolio URL</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://apexdesign.studio"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Creator Profile */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 3: Creator Public Profile</h2>
                    <p className="text-xs text-slate-500">How buyers on Desigot will see your agency profile and expertise.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Professional Bio *</label>
                      <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Introduce your studio, design philosophy, notable clients, and technical competencies..."
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Skills & Tools</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.skill_input}
                          onChange={(e) => setFormData({ ...formData, skill_input: e.target.value })}
                          placeholder="e.g. Figma Tokens, React Native, SaaS UI"
                          className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                        <Button variant="secondary" size="sm" type="button" onClick={handleAddSkill}>
                          Add Skill
                        </Button>
                      </div>

                      {formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {formData.skills.map((s) => (
                            <span
                              key={s}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium"
                            >
                              {s}
                              <button type="button" onClick={() => handleRemoveSkill(s)} className="text-slate-400 hover:text-rose-500">
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={formData.years_of_experience}
                          onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 1 })}
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Dribbble / Behance Profile</label>
                        <input
                          type="url"
                          value={formData.portfolio_url}
                          onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                          placeholder="https://dribbble.com/yourstudio"
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Identity Verification */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 4: Identity & Compliance Verification</h2>
                    <p className="text-xs text-slate-500">Regulatory standards mandate KYC compliance for payout disbursement.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Document Type</label>
                      <select
                        value={formData.id_document_type}
                        onChange={(e) => setFormData({ ...formData, id_document_type: e.target.value })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                      >
                        <option value="Passport">International Passport</option>
                        <option value="National ID">National Identity Card</option>
                        <option value="Driver License">Driver&apos;s License</option>
                        <option value="Company Registration">Business Certificate of Incorporation</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Secure ID Document Storage URL / File</label>
                      <input
                        type="text"
                        value={formData.id_document_url}
                        onChange={(e) => setFormData({ ...formData, id_document_url: e.target.value })}
                        placeholder="https://secure-docs.desigot.com/kyc-doc-ref"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Encrypted with AES-256 and accessible strictly by authorized Desigot compliance managers.
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.verification_consent}
                          onChange={(e) => setFormData({ ...formData, verification_consent: e.target.checked })}
                          className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <div className="text-xs text-slate-700">
                          <span className="font-bold block">Consent to Verification & Anti-Fraud Screening</span>
                          <span className="text-slate-500 text-[11px] leading-relaxed block">
                            I verify that all submitted identification represents legitimate legal authority and consent to background security screening according to Desigot Privacy and Financial Standards.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Agreements & Submit */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 5: Creator Agreements & Terms</h2>
                    <p className="text-xs text-slate-500">Please review and accept our marketplace policies.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.agreed_terms}
                        onChange={(e) => setFormData({ ...formData, agreed_terms: e.target.checked })}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Marketplace Seller Agreement</span>
                        <span className="text-slate-500 text-[11px]">
                          I agree to provide authentic digital deliverables, maintain responsive client communication, and abide by Desigot dispute resolution procedures.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.agreed_commission}
                        onChange={(e) => setFormData({ ...formData, agreed_commission: e.target.checked })}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Platform Commission & Payout Policy</span>
                        <span className="text-slate-500 text-[11px]">
                          I understand that Desigot deducts a platform service fee on successful transactions and facilitates payouts via Stripe or Wire according to the scheduled payout window.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.agreed_guidelines}
                        onChange={(e) => setFormData({ ...formData, agreed_guidelines: e.target.checked })}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Quality Standards & Community Guidelines</span>
                        <span className="text-slate-500 text-[11px]">
                          I agree not to upload plagiarized work, copyrighted assets without authorization, or malicious code.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
                {step > 1 ? (
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    onClick={() => setStep((s) => Math.max(s - 1, 1))}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <Button
                    variant="accent"
                    size="md"
                    type="button"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleNextStep}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    size="lg"
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={submitApp.isPending}
                  >
                    {submitApp.isPending ? "Submitting..." : "Submit Application for Review"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
