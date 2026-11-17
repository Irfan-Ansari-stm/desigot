"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Sparkles, 
  Globe2, 
  HeartHandshake, 
  Laptop, 
  ArrowRight 
} from "lucide-react";

export default function CareersPage() {
  const jobs = [
    {
      title: "Senior Product Designer (Design Systems)",
      department: "Product & Experience",
      location: "Remote (Global)",
      type: "Full-Time",
      description: "Lead the evolution of the Desigot Core UI framework, author Figma libraries, and review enterprise vendor submissions."
    },
    {
      title: "Principal Full-Stack Engineer (Next.js / Node.js)",
      department: "Core Engineering",
      location: "San Francisco, CA or Remote",
      type: "Full-Time",
      description: "Scale our high-throughput marketplace engine, digital asset distribution pipelines, and real-time collaboration tools."
    },
    {
      title: "Creator Partnerships Lead",
      department: "Marketplace Growth",
      location: "New York, NY or Remote",
      type: "Full-Time",
      description: "Identify and recruit top-tier design studios, Figma community leaders, and independent creators into exclusive seller tiers."
    },
    {
      title: "Marketplace Integrity & QA Specialist",
      department: "Trust & Safety",
      location: "Remote (EMEA / APAC)",
      type: "Full-Time",
      description: "Inspect inbound digital asset packages for visual fidelity, layer hygiene, licensing compliance, and security."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            We Are Hiring
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Build the Future of Design with Us
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Join a remote-first, design-obsessed global team empowering over 500,000 digital product teams worldwide.
          </p>
        </div>

        {/* Culture / Perks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2">
            <Globe2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">100% Remote-First</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Work from anywhere on Earth. We offer flexible hours, home office stipends, and co-working allowances.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2">
            <Laptop className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Top-Tier Tech & Tools</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              New MacBook Pro, 4K monitors, unlimited Figma, Linear, and software licenses for all teammates.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2">
            <HeartHandshake className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Equity & Health Benefits</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Comprehensive medical, dental, vision coverage, 401(k) matching, and meaningful company equity grants.
            </p>
          </div>
        </div>

        {/* Open Roles */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Open Opportunities</h2>
          <div className="space-y-3">
            {jobs.map((job, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{job.title}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                      {job.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{job.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {job.type}
                    </span>
                  </div>
                </div>

                <Link
                  href="/contact?subject=Careers"
                  className="shrink-0 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  Apply
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
