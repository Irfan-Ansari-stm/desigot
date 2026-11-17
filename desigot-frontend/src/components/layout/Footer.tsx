"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "@/store/ui.store";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Sparkles,
} from "lucide-react";

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.65 1.65 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66c0-.92-.74-1.66-1.66-1.66z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 2a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4V2H8zm8 0h-4v8h4a4 4 0 0 0 4-4 4 4 0 0 0-4-4zM8 10a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4v-8H8zm8 0a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm-8 8a4 4 0 0 0-4 4 4 4 0 0 0 7.41 2.07L8 24a4 4 0 0 0 0-6z" />
    </svg>
  );
}

interface FooterLink {
  id: string;
  label: string;
  url: string;
  sort_order?: number;
  route_type?: string;
  open_behavior?: string;
}

interface FooterColumn {
  id: string;
  title: string;
  slug?: string;
  column_order: number;
  is_active?: boolean;
  links: FooterLink[];
}

interface FooterSettings {
  brand_name?: string;
  brand_description?: string;
  company_info?: string;
  copyright_owner?: string;
  copyright_text?: string;
  copyright_year_mode?: string;
  manual_copyright_year?: number;
  background_color?: string;
  heading_color?: string;
  text_color?: string;
  link_color?: string;
  hover_color?: string;
  border_color?: string;
  newsletter_enabled?: boolean;
  newsletter_title?: string;
  newsletter_description?: string;
  cta_enabled?: boolean;
  cta_heading?: string;
  cta_description?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  social_links_json?: Record<string, string>;
  payment_icons_json?: string[];
}

export function Footer() {
  const [footerData, setFooterData] = useState<{
    settings: FooterSettings | null;
    columns: FooterColumn[];
    social_links: any[];
    legal_links: any[];
  } | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function loadFooter() {
      try {
        const res = await api.get("/public/footer");
        if (res.data?.data) {
          setFooterData(res.data.data);
        }
      } catch (err) {
        try {
          const cmsRes = await api.get("/public/cms/footer");
          if (cmsRes.data?.data) {
            setFooterData(cmsRes.data.data);
          }
        } catch (_) {}
      }
    }
    loadFooter();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubscribing(true);
    try {
      const res = await api.post("/public/newsletter/subscribe", { email: newsletterEmail.trim() });
      setSubscribed(true);
      toast.success(res.data?.message || "Subscribed successfully! Welcome to Desigot.");
      setNewsletterEmail("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to subscribe to newsletter.");
    } finally {
      setSubscribing(false);
    }
  };

  const settings = footerData?.settings;
  const currentYear = new Date().getFullYear();
  const copyrightYear =
    settings?.copyright_year_mode === "manual" && settings?.manual_copyright_year
      ? settings.manual_copyright_year
      : currentYear;

  const brandDescription =
    settings?.brand_description ||
    settings?.company_info ||
    "Desigot is the global creative marketplace for enterprise design systems, digital assets, and vetted agency services.";

  const copyrightText =
    settings?.copyright_text ||
    `© ${copyrightYear} ${settings?.copyright_owner || "Desigot Inc."} All rights reserved. Crafted for visionary design teams worldwide.`;

  // Default Columns fallback if API is loading
  const defaultColumns: FooterColumn[] = [
    {
      id: "col-marketplace",
      title: "Marketplace",
      column_order: 1,
      links: [
        { id: "1", label: "Explore All Assets", url: "/browse" },
        { id: "2", label: "UI Kits & Systems", url: "/categories/ui-kits" },
        { id: "3", label: "Figma Templates", url: "/categories/figma-templates" },
        { id: "4", label: "Mobile App Screens", url: "/categories/mobile-apps" },
        { id: "5", label: "Dashboard SaaS Themes", url: "/categories/dashboards" },
      ],
    },
    {
      id: "col-services",
      title: "Design Services",
      column_order: 2,
      links: [
        { id: "6", label: "Browse All Services", url: "/services" },
        { id: "7", label: "Web & Landing Pages", url: "/services" },
        { id: "8", label: "Mobile App UX", url: "/services" },
        { id: "9", label: "Design System Sprint", url: "/services" },
        { id: "10", label: "SaaS Heuristic Audit", url: "/services" },
      ],
    },
    {
      id: "col-creators",
      title: "Creators & Sellers",
      column_order: 3,
      links: [
        { id: "11", label: "Become a Seller", url: "/seller/onboarding" },
        { id: "12", label: "Creator Guidelines", url: "/seller/guidelines" },
        { id: "13", label: "Seller Earnings & Fees", url: "/seller/fees" },
        { id: "14", label: "Affiliate Program", url: "/affiliate" },
        { id: "15", label: "Creator Success Stories", url: "/success-stories" },
      ],
    },
    {
      id: "col-company",
      title: "Company & Team",
      column_order: 4,
      links: [
        { id: "16", label: "About Desigot", url: "/about" },
        { id: "17", label: "Careers & Hiring", url: "/careers" },
        { id: "18", label: "Brand & Media Kit", url: "/brand-kit" },
        { id: "19", label: "Press Releases", url: "/press" },
        { id: "20", label: "Contact Support", url: "/contact" },
      ],
    },
    {
      id: "col-help",
      title: "Help & Resources",
      column_order: 5,
      links: [
        { id: "21", label: "Help Center & FAQs", url: "/faq" },
        { id: "22", label: "Customer Concierge", url: "/contact" },
        { id: "23", label: "Design Insights Blog", url: "/blog" },
        { id: "24", label: "Refund Policy", url: "/refund-policy" },
        { id: "25", label: "Community Forum", url: "/blog" },
      ],
    },
  ];

  // Active navigation columns (exclude legal column which is rendered in bottom strip)
  const columns =
    footerData?.columns && footerData.columns.length > 0
      ? footerData.columns.filter(
          (c) =>
            c.is_active !== false &&
            c.title !== "Legal & Compliance" &&
            c.slug !== "legal-compliance"
        )
      : defaultColumns;

  // Social Links mapping with safe fallbacks (profile_url or url)
  const socialIconsMap: Record<string, any> = {
    twitter: TwitterIcon,
    x: TwitterIcon,
    linkedin: LinkedinIcon,
    github: GithubIcon,
    figma: FigmaIcon,
  };

  const dynamicSocialList =
    footerData?.social_links && footerData.social_links.length > 0
      ? footerData.social_links.map((s) => ({
          name: s.platform || "Social",
          href: s.profile_url || s.url || "#",
          icon: socialIconsMap[(s.platform || "").toLowerCase()] || ExternalLink,
        }))
      : [
          { name: "Twitter / X", href: "https://twitter.com/desigot", icon: TwitterIcon },
          { name: "LinkedIn", href: "https://linkedin.com/company/desigot", icon: LinkedinIcon },
          { name: "GitHub", href: "https://github.com/desigot", icon: GithubIcon },
          { name: "Figma", href: "https://figma.com/@desigot", icon: FigmaIcon },
        ];

  // Legal Links mapping with safe fallbacks (title or label)
  const dynamicLegalList =
    footerData?.legal_links && footerData.legal_links.length > 0
      ? footerData.legal_links.map((l) => ({
          title: l.title || l.label || "Policy",
          url: l.url || "#",
          open_behavior: l.open_behavior || "same_tab",
        }))
      : [
          { title: "Privacy Policy", url: "/privacy", open_behavior: "same_window" },
          { title: "Terms of Service", url: "/terms", open_behavior: "same_window" },
          { title: "Refund Policy", url: "/refund-policy", open_behavior: "same_window" },
          { title: "Cookie Policy", url: "/cookie-policy", open_behavior: "same_window" },
          { title: "Accessibility", url: "/accessibility", open_behavior: "same_window" },
        ];

  // Dynamic grid classes based on column count
  const columnGridClass =
    columns.length >= 5
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  return (
    <footer
      role="contentinfo"
      aria-label="Desigot Marketplace Global Footer"
      className="bg-[#0B0F19] text-[#91A8C7] border-t border-[#263144] relative z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Optional Call to Action (CTA) Banner */}
        {settings?.cta_enabled && (
          <div className="mb-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/60 border border-purple-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Featured Opportunity
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {settings?.cta_heading || "Ready to launch your next project?"}
              </h3>
              <p className="text-xs sm:text-sm text-[#91A8C7] max-w-xl">
                {settings?.cta_description ||
                  "Discover vetted design assets and elite designers tailored for your high-growth products."}
              </p>
            </div>
            <Link
              href={settings?.cta_button_url || "/products"}
              className="shrink-0 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>{settings?.cta_button_text || "Explore Marketplace"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Optional Newsletter Strip */}
        {(settings?.newsletter_enabled ?? true) && (
          <div className="mb-14 pb-12 border-b border-[#263144] flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {settings?.newsletter_title || "Join the global creative network"}
              </h3>
              <p className="text-xs sm:text-sm text-[#91A8C7] mt-1.5 leading-relaxed">
                {settings?.newsletter_description ||
                  "Receive curated design systems, UI inspirations, and creator spotlights directly to your inbox."}
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto"
            >
              <div className="relative w-full sm:w-80">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="Enter your work email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-[#141A29] text-white border border-[#263144] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={subscribing || subscribed}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {subscribing ? (
                  <span>Subscribing...</span>
                ) : subscribed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Subscribed
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Dynamic Columns Layout */}
        <div className={`grid ${columnGridClass} gap-10 lg:gap-8`}>
          {/* Column 1: Brand Info & Socials */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-sm tracking-tighter">D</span>
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">Desigot</span>
            </Link>

            <p className="text-xs leading-relaxed text-[#91A8C7] max-w-sm">
              {brandDescription}
            </p>

            {/* Social Links */}
            <div className="pt-2 flex items-center gap-3">
              {dynamicSocialList.map((social, sIdx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name ? `${social.name}-${sIdx}` : `social-${sIdx}`}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit Desigot on ${social.name}`}
                    className="w-8 h-8 rounded-lg bg-[#141A29] border border-[#263144] text-[#91A8C7] hover:text-white hover:border-purple-500/50 hover:bg-purple-600/10 flex items-center justify-center transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Columns */}
          {columns.map((col, colIdx) => (
            <div key={col.id || `col-${colIdx}`} className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links?.map((link, linkIdx) => (
                  <li key={link.id || `${link.label || "link"}-${linkIdx}`}>
                    <Link
                      href={link.url}
                      className="text-xs text-[#91A8C7] hover:text-white transition-colors duration-150 block truncate"
                      {...(link.open_behavior === "new_tab" || link.url.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider & Bottom Legal Strip */}
        <div className="mt-14 pt-8 border-t border-[#263144] flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-center md:text-left text-slate-500">
            <p>{copyrightText}</p>
          </div>

          {/* Trust Payment Badges */}
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-emerald-400/80" />
            <span>Secure 256-bit SSL Encrypted Payments</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {dynamicLegalList.map((legal, legalIdx) => (
              <Link
                key={legal.title ? `${legal.title}-${legalIdx}` : `legal-${legalIdx}`}
                href={legal.url}
                className="text-slate-500 hover:text-white transition-colors"
                {...(legal.open_behavior === "new_tab" || legal.url.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {legal.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
