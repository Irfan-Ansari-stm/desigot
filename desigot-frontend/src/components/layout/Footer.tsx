"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const defaultSections = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse Assets", href: "/browse?listing_type=asset" },
      { label: "Browse Services", href: "/browse?listing_type=service" },
      { label: "Featured Collections", href: "/categories" },
      { label: "How It Works", href: "/pages/how-it-works" }
    ]
  },
  {
    title: "Sellers & Creators",
    links: [
      { label: "Start Selling", href: "/become-seller" },
      { label: "Pricing & Fees", href: "/pages/pricing-guide" },
      { label: "Creator Guidelines", href: "/pages/creators-program" },
      { label: "Seller Handbook", href: "/pages/seller-handbook" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Editorial Blog", href: "/blog" },
      { label: "Careers", href: "/pages/careers" },
      { label: "Press Kit", href: "/pages/press" },
      { label: "Enterprise", href: "/pages/enterprise" }
    ]
  },
  {
    title: "Support & Legal",
    links: [
      { label: "Help & FAQs", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refund-policy" }
    ]
  }
];

export function Footer() {
  const [footerData, setFooterData] = useState<any>(null);

  useEffect(() => {
    async function fetchFooter() {
      try {
        const res = await api.get("/public/cms/footer");
        if (res.data?.data) {
          setFooterData(res.data.data);
        }
      } catch (err) {
        // Fallback silently to defaultSections
      }
    }
    fetchFooter();
  }, []);

  const columns = footerData?.columns && footerData.columns.length > 0 ? footerData.columns : null;
  const companyInfo = footerData?.settings?.company_info || "The premier global marketplace for enterprise design systems, digital assets, and custom agency services.";
  const copyrightText = footerData?.settings?.copyright_text || "© 2026 Desigot Inc. All rights reserved.";

  return (
    <footer className="bg-[#0B0F19] text-white/80 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="font-black text-xl text-white tracking-tight">Desigot</span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              {companyInfo}
            </p>
            <div className="flex items-center gap-3 mt-4">
              {["Twitter", "LinkedIn", "GitHub", "Figma"].map((s) => (
                <a key={s} href={`https://${s.toLowerCase()}.com`} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-white transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {columns
            ? columns.slice(0, 4).map((col: any) => (
                <div key={col.id}>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links?.map((link: any) => (
                      <li key={link.id}>
                        <Link href={link.url} className="text-xs text-slate-400 hover:text-white transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            : defaultSections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-xs text-slate-400 hover:text-white transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">{copyrightText}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/refund-policy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
