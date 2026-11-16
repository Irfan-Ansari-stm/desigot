"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { Sparkles, ShieldCheck, Heart, Award } from "lucide-react";

export default function PublicAboutPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAbout() {
      try {
        const res = await api.get("/public/cms/about");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load about data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAbout();
  }, []);

  const content = data?.content || {};
  const team = data?.team || [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-16 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Our Mission & Origin
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {content.title || "Empowering the Next Generation of Product Designers & Builders"}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {content.intro || "Desigot was founded to build a bridge between world-class designers and software builders seeking high-velocity execution."}
          </p>
        </div>

        {/* Hero Image */}
        {content.hero_image_url && (
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 h-96 relative">
            <img
              src={content.hero_image_url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Mission & Vision Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              Our Mission
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {content.mission || "To provide software engineering teams with immaculate design foundations while giving creators sustainable, rewarding careers."}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Our Vision
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {content.vision || "A global economy where every digital interface is intuitive, accessible, and masterfully crafted."}
            </p>
          </div>
        </div>

        {/* Story Section */}
        {content.story_html && (
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Story</h2>
            <div
              className="prose dark:prose-invert text-slate-600 dark:text-slate-400 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content.story_html }}
            />
          </div>
        )}

        {/* Team Members */}
        {team.length > 0 && (
          <div className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Executive Leadership</h2>
              <p className="text-xs text-slate-500">
                Pioneering product design systems and marketplace trust & safety.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((m: any) => (
                <div
                  key={m.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm text-center space-y-3"
                >
                  <img
                    src={m.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"}
                    alt={m.name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</h4>
                    <p className="text-xs text-purple-600 font-semibold">{m.role}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3">{m.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
