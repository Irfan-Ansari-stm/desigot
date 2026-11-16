"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { usePublicProduct } from "@/hooks/useMarketplace";
import { useCartStore } from "@/store/cart.store";
import {
  Star,
  Download,
  ShieldCheck,
  Check,
  ChevronRight,
  Package,
  Layers,
  FileCode,
  Share2,
  FileCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { data, isLoading, error } = usePublicProduct(slug);
  const addItem = useCartStore((s) => s.addItem);

  const [selectedLicenseIndex, setSelectedLicenseIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Loading product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Product Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">The digital asset you requested could not be located.</p>
          <Link href="/products"><Button variant="accent">Explore All Digital Assets</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { product, licenses, files, reviews, related_products, seller } = data;
  const currentLicense = licenses?.[selectedLicenseIndex] || {
    id: "lic-personal",
    name: "Personal License",
    price_cents: product.price_cents || 2900,
    description: "Standard personal and internal prototyping usage."
  };

  const previewImages = Array.isArray(product.preview_images) && product.preview_images.length > 0
    ? product.preview_images
    : [product.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"];

  const handleBuyNow = () => {
    addItem({
      id: `${product.id}-${currentLicense.id}`,
      item_type: "product",
      product_id: product.id,
      title: `${product.title} (${currentLicense.name})`,
      price_cents: currentLicense.price_cents,
      quantity: 1,
      thumbnail_url: previewImages[0],
      seller_name: seller.name,
      license_type: currentLicense.name,
    });
    router.push("/checkout");
  };

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${currentLicense.id}`,
      item_type: "product",
      product_id: product.id,
      title: `${product.title} (${currentLicense.name})`,
      price_cents: currentLicense.price_cents,
      quantity: 1,
      thumbnail_url: previewImages[0],
      seller_name: seller.name,
      license_type: currentLicense.name,
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
          <Link href="/products" className="hover:text-rose-600">Digital Assets</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-900 truncate max-w-xs">{product.title}</span>
        </div>

        {/* Top Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Gallery & Specs */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {product.title}
              </h1>

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
                  {seller.is_verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                </Link>

                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{Number(product.rating || 4.9).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({product.review_count || 12} reviews)</span>
                </div>

                <span className="text-slate-300">•</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> {product.download_count || 320} downloads
                </span>

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

            {/* Gallery Image */}
            <div className="space-y-3">
              <div className="aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden shadow-sm relative">
                <img
                  src={previewImages[selectedImage] || previewImages[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {previewImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previewImages.map((img: string, idx: number) => (
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
              <h2 className="text-lg font-bold text-slate-900">Asset Overview & Specifications</h2>
              <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                {product.description || product.short_description || "High-performance digital design system including vector components, auto-layout presets, design tokens, and comprehensive documentation."}
              </div>

              {/* Formats and Software */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">File Formats</span>
                  <span className="text-slate-600">{Array.isArray(product.file_formats) ? product.file_formats.join(", ") : ".fig, .sketch, .svg, .png"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Compatibility</span>
                  <span className="text-slate-600">{Array.isArray(product.software_compatibility) ? product.software_compatibility.join(", ") : "Figma, Sketch, Adobe XD, Tailwind CSS"}</span>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Buyer Reviews</h2>
                <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-lg">
                  <Star className="w-5 h-5 fill-current" />
                  <span>{Number(product.rating || 4.9).toFixed(1)}</span>
                </div>
              </div>

              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{r.user_name}</span>
                        <div className="flex text-amber-500">
                          {Array.from({ length: Math.round(Number(r.rating_overall || 5)) }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{r.review_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No reviews yet for this product. Be the first to download and review!</p>
              )}
            </div>
          </div>

          {/* Right: Sticky Buy Box & License Selector */}
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Tier</span>
                <div className="mt-3 space-y-2">
                  {licenses?.map((lic: any, idx: number) => (
                    <label
                      key={lic.id || idx}
                      onClick={() => setSelectedLicenseIndex(idx)}
                      className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedLicenseIndex === idx ? "border-rose-500 bg-rose-50/40" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 block">{lic.name}</span>
                        <span className="text-[11px] text-slate-500 block leading-tight">{lic.description}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 ml-3">
                        ${(lic.price_cents / 100).toFixed(0)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Total Price */}
              <div className="flex items-baseline justify-between pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Instant Access Total</span>
                <span className="text-3xl font-black text-slate-900">
                  ${(currentLicense.price_cents / 100).toFixed(0)}
                </span>
              </div>

              {/* Guarantees */}
              <div className="space-y-2 text-xs text-slate-600 py-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant ZIP Download & Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Lifetime Free Version Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Virus Scanned & Clean Source Code</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button variant="accent" size="lg" fullWidth onClick={handleBuyNow}>
                  Buy & Download Now (${(currentLicense.price_cents / 100).toFixed(0)})
                </Button>
                <Button variant="secondary" size="md" fullWidth onClick={handleAddToCart}>
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related_products && related_products.length > 0 && (
          <section className="space-y-4 pt-10 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Similar Digital Assets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {related_products.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden mb-3">
                    <img
                      src={rel.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{rel.seller_name}</span>
                    <span className="font-bold text-slate-900">${(rel.price_cents / 100).toFixed(0)}</span>
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
