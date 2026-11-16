"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function PublicFaqPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string>("");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await api.get("/public/cms/faqs");
        if (res.data?.data) {
          setCategories(res.data.data.categories || []);
          setFaqs(res.data.data.faqs || []);
          if (res.data.data.categories?.length > 0) {
            setActiveCat(res.data.data.categories[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load FAQs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const filteredFaqs = faqs.filter((f) => {
    const matchesSearch = search
      ? f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer_html.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCat = activeCat ? f.category_id === activeCat : true;
    return search ? matchesSearch : matchesCat;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-10 flex-1">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            Knowledge Base
          </div>
          <h1 className="text-4xl font-black tracking-tight">Frequently Asked Questions</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Learn more about licensing, milestone escrow protection, digital asset delivery, and royalties.
          </p>

          <div className="relative pt-4">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge base for answers..."
              className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>
        </div>

        {/* Categories Horizontal Tabs */}
        {!search && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center border-b border-slate-100 dark:border-slate-800">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeCat === c.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Accordions */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-purple-600 transition"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-purple-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: faq.answer_html }} />
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching questions found. Contact our support team for personalized assistance.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
