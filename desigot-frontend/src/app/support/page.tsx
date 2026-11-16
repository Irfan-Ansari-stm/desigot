"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  LifeBuoy,
  Search,
  BookOpen,
  FileQuestion,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const FAQ_TOPICS = [
  {
    title: "Purchases & Downloads",
    desc: "How to download digital assets, license keys, and file formats.",
    articles: [
      "Downloading your purchased assets",
      "Understanding Commercial vs Extended licenses",
      "Requesting a refund for defective files",
    ],
  },
  {
    title: "Seller Onboarding & Payouts",
    desc: "Selling products, KYC verification, and withdrawal schedules.",
    articles: [
      "Becoming a verified Desigot creator",
      "Electronic payout methods and thresholds",
      "Author commission structure and fees",
    ],
  },
  {
    title: "Custom Services & Escrow",
    desc: "Service milestones, revisions, and buyer protection.",
    articles: [
      "How milestone escrow protects buyers and sellers",
      "Requesting deliverables revision",
      "Opening a mediation dispute",
    ],
  },
  {
    title: "Account & Security",
    desc: "Two-factor authentication, email updates, and password recovery.",
    articles: [
      "Enabling two-factor authentication (2FA)",
      "Resetting account credentials",
      "Managing notification preferences",
    ],
  },
];

export default function SupportCenterPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Hero Section */}
        <div className="bg-brand text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/20">
              <LifeBuoy className="h-3.5 w-3.5" />
              Desigot Help & Support Center
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              How can we help you today?
            </h1>
            <p className="text-white/80 text-sm max-w-xl mx-auto">
              Find instant answers to common questions or submit a support ticket directly to our concierge team.
            </p>

            <div className="pt-4 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-ink-tertiary" />
                <input
                  type="text"
                  placeholder="Search articles, licenses, refunds, payouts..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-ink-primary text-sm shadow-lg focus:outline-none focus:ring-4 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-ink-primary text-lg mb-1">Submit a Ticket</h3>
              <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
                Need direct assistance with an order, account verification, or billing question?
              </p>
              <Link href="/support/tickets">
                <Button variant="primary" size="sm" className="w-full">
                  Open Support Ticket
                </Button>
              </Link>
            </Card>

            <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <FileQuestion className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-ink-primary text-lg mb-1">FAQ & Guidelines</h3>
              <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
                Read our complete knowledge base covering licensing, refunds, and author rules.
              </p>
              <Link href="/faq">
                <Button variant="outline" size="sm" className="w-full">
                  Browse FAQs
                </Button>
              </Link>
            </Card>

            <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-ink-primary text-lg mb-1">Buyer & Seller Protection</h3>
              <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
                Learn how our escrow system and verification protocols ensure transaction safety.
              </p>
              <Link href="/contact">
                <Button variant="secondary" size="sm" className="w-full">
                  Contact Concierge
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Knowledge Base Topics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-2xl font-black text-ink-primary mb-6">Popular Help Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FAQ_TOPICS.map((topic, i) => (
              <Card key={i} className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-ink-primary text-base mb-1">{topic.title}</h3>
                  <p className="text-xs text-ink-secondary mb-4">{topic.desc}</p>
                  <ul className="space-y-2 text-xs text-ink-primary">
                    {topic.articles.map((art, j) => (
                      <li key={j} className="flex items-center gap-1.5 text-brand hover:underline cursor-pointer">
                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{art}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
