"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";

export default function PublicContactPage() {
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadContact() {
      try {
        const res = await api.get("/public/cms/contact");
        if (res.data?.data) setSettings(res.data.data);
      } catch (err) {
        console.error("Failed to load contact info:", err);
      }
    }
    loadContact();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/public/cms/contact", formData);
      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-12 flex-1">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-4xl font-black tracking-tight">
            {settings?.heading || "Get in Touch with Desigot Support"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {settings?.description || "We are here to assist with transactions, creator partnerships, and marketplace inquiries."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coordinates Column */}
          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-lg font-bold">Contact Channels</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-500">Support Email</span>
                  <a href={`mailto:${settings?.support_email || "support@desigot.com"}`} className="font-bold text-purple-600">
                    {settings?.support_email || "support@desigot.com"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-500">Phone Support</span>
                  <span className="font-bold">{settings?.phone || "+1 (800) 555-0199"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-500">San Francisco HQ</span>
                  <span className="leading-relaxed block">{settings?.address || "100 Montgomery St, San Francisco, CA"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-500">Operating Hours</span>
                  <span>{settings?.business_hours || "Mon – Fri: 9:00 AM – 6:00 PM PST"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold">Send us a direct message</h3>

            {success ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Thank you!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your message has been assigned ticket ID and our compliance team will respond within 24 hours.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@company.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Inquiry Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Enterprise License Query"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can our support team assist you today?"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? "Sending..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
