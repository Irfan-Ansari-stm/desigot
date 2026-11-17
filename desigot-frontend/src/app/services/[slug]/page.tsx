"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { usePublicService } from "@/hooks/useMarketplace";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import {
  Star,
  Clock,
  RotateCcw,
  ShieldCheck,
  Check,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  HelpCircle,
  Share2,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { data, isLoading, error } = usePublicService(slug);
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();

  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Loading service details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data?.service) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Service Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">This service listing does not exist or may have been unlisted.</p>
          <Link href="/services"><Button variant="accent">Explore All Services</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { service, packages, media, reviews, related_services, seller } = data;
  const currentPkg = packages?.[selectedPkgIndex] || {
    id: "pkg-basic",
    name: "Basic",
    price_cents: service.starting_price_cents || 4900,
    delivery_time_days: service.delivery_time_days || 3,
    revisions: service.revision_limit || 2,
    features: ["Source files", "High-res exports", "Commercial license"]
  };

  const galleryImages = media?.length > 0 ? media.map((m: any) => m.file_url) : [
    service.featured_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80"
  ];

  const handleOrderNow = () => {
    addItem({
      id: `${service.id}-${currentPkg.id}`,
      item_type: "service",
      service_id: service.id,
      title: `${service.title} (${currentPkg.name} Tier)`,
      price_cents: currentPkg.price_cents,
      quantity: 1,
      thumbnail_url: galleryImages[0],
      seller_name: seller.name,
      package_name: currentPkg.name,
      delivery_time_days: currentPkg.delivery_time_days,
    });
    router.push("/checkout");
  };

  const handleAddToCart = () => {
    addItem({
      id: `${service.id}-${currentPkg.id}`,
      item_type: "service",
      service_id: service.id,
      title: `${service.title} (${currentPkg.name} Tier)`,
      price_cents: currentPkg.price_cents,
      quantity: 1,
      thumbnail_url: galleryImages[0],
      seller_name: seller.name,
      package_name: currentPkg.name,
      delivery_time_days: currentPkg.delivery_time_days,
    });
    router.push("/cart");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 flex-1 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-rose-600">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/services" className="hover:text-rose-600">Services</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-900 truncate max-w-xs">{service.title}</span>
        </div>

        {/* Top Split: Gallery & Overview vs Sticky Pricing Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 7 cols: Title, Gallery, Description, FAQs, Reviews */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {service.title}
              </h1>

              {/* Seller & Rating Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <Link href={`/seller/${seller.username || seller.id}`} className="flex items-center gap-2 group">
                  <img
                    src={seller.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.name}`}
                    alt={seller.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <span className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                    {seller.name}
                  </span>
                  {seller.is_verified && (
                    <span title="Verified Agency Specialist">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{Number(seller.rating || 4.9).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({seller.reviews_count || 18} reviews)</span>
                </div>

                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{service.category_name || "UI/UX Design"}</span>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Share listing"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {copied && <span className="text-[10px] font-bold text-emerald-600">Copied!</span>}
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-3">
              <div className="aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden shadow-sm relative">
                <img
                  src={galleryImages[selectedImage] || galleryImages[0]}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${selectedImage === idx ? "border-rose-500 ring-2 ring-rose-500/30" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">About This Service</h2>
              <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                {service.description || service.short_description || "Comprehensive bespoke deliverables tailored to your product sprint with complete Figma source assets."}
              </div>

              {service.deliverables && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">What You Receive</h3>
                  <p className="text-xs text-slate-600">{service.deliverables}</p>
                </div>
              )}
            </div>

            {/* Seller Profile Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-start justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={seller.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.name}`}
                  alt={seller.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{seller.name}</h3>
                    {seller.is_verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md">{seller.bio || "Senior Product Designer & Design Systems Architect."}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>{seller.total_sales || 140} Orders Completed</span>
                    <span>★ {Number(seller.rating || 4.9).toFixed(1)} Rating</span>
                  </div>
                </div>
              </div>

              <Link href={`/account/messages?to=${seller.id}`} className="shrink-0">
                <Button variant="secondary" size="sm" leftIcon={<MessageSquare className="w-3.5 h-3.5" />}>
                  Contact Seller
                </Button>
              </Link>
            </div>

            {/* Reviews Section */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Client Reviews</h2>
                  <p className="text-xs text-slate-500">Verified buyer feedback on completed orders</p>
                </div>
                <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-lg">
                  <Star className="w-5 h-5 fill-current" />
                  <span>{Number(seller.rating || 4.9).toFixed(1)}</span>
                </div>
              </div>

              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={r.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${r.user_name}`}
                            alt={r.user_name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="font-bold text-slate-800">{r.user_name}</span>
                        </div>
                        <div className="flex text-amber-500">
                          {Array.from({ length: Math.round(Number(r.rating_overall || 5)) }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      {r.title && <p className="text-xs font-bold text-slate-900">{r.title}</p>}
                      <p className="text-xs text-slate-600 leading-relaxed">{r.review_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No reviews yet for this listing. Be the first to order!</p>
              )}
            </div>
          </div>

          {/* RIGHT 4 cols: Sticky Package Selector & Purchase Box */}
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
              
              {/* Package Tabs */}
              <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                {packages?.map((pkg: any, idx: number) => (
                  <button
                    key={pkg.id || idx}
                    type="button"
                    onClick={() => setSelectedPkgIndex(idx)}
                    className={`py-2 rounded-xl transition-all text-center ${selectedPkgIndex === idx ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {pkg.name}
                  </button>
                ))}
              </div>

              {/* Selected Tier Pricing */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentPkg.name} Tier</span>
                  <span className="text-3xl font-black text-slate-900">
                    ${(currentPkg.price_cents / 100).toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentPkg.description}
                </p>
              </div>

              {/* Delivery and Revision Details */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span>{currentPkg.delivery_time_days} Days Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>{currentPkg.revisions} Revisions</span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800">What&apos;s Included:</p>
                <div className="space-y-1.5">
                  {(currentPkg.features || [
                    "Full editable Figma source files",
                    "Typography & design tokens documentation",
                    "Commercial usage license",
                    "Direct Slack/Discord milestone handoff"
                  ]).map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button variant="accent" size="lg" fullWidth onClick={handleOrderNow}>
                  Order Now (${(currentPkg.price_cents / 100).toFixed(0)})
                </Button>
                <Button variant="secondary" size="md" fullWidth onClick={handleAddToCart}>
                  Add to Cart
                </Button>
              </div>

              {/* Escrow Guarantee */}
              <div className="pt-2 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Desigot Escrow Guarantee
                </p>
                <p className="text-[10px] text-slate-400">
                  Payment is held in escrow until you approve the milestone deliverable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Services */}
        {related_services && related_services.length > 0 && (
          <section className="space-y-4 pt-10 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Related Agency Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {related_services.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/services/${rel.slug}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden mb-3">
                    <img
                      src={rel.featured_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80"}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{rel.seller_name}</span>
                    <span className="font-bold text-slate-900">${(rel.starting_price_cents / 100).toFixed(0)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
