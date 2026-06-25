"use client";
// @ts-nocheck
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { useListing } from "@/hooks/useListings";
import { useCreateOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StarRating } from "@/components/ui/StarRating";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { ShoppingCart, Heart, Share2, Shield, Download, Star, Eye, ImageOff, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { LicenseType } from "@/types";

export default function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: listing, isLoading } = useListing(slug);
  const createOrder = useCreateOrder();

  const [selectedLicense, setSelectedLicense] = useState<LicenseType>("personal");
  const [activeImg, setActiveImg] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const handleBuy = async () => {
    if (!isAuthenticated()) { router.push("/auth/login"); return; }
    try {
      const order = await createOrder.mutateAsync({ listing_id: listing!.id, license_type: selectedLicense });
      toast.success("Order created! Proceeding to checkout.");
      router.push(`/checkout?order_id=${order.id}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const previewImages = listing?.media?.filter((m) => m.media_type === "preview_image") || [];
  const selectedPrice = listing ? {
    personal: listing.price_personal,
    commercial: listing.price_commercial,
    extended: listing.price_extended,
  }[selectedLicense] : undefined;

  const licenseOptions = listing ? [
    listing.price_personal  && { value: "personal",   label: `Personal — ${formatPrice(listing.price_personal)}` },
    listing.price_commercial && { value: "commercial", label: `Commercial — ${formatPrice(listing.price_commercial)}` },
    listing.price_extended  && { value: "extended",   label: `Extended — ${formatPrice(listing.price_extended)}` },
  ].filter(Boolean) as { value: string; label: string }[] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center"><h2 className="text-xl font-semibold text-ink-primary">Listing not found</h2><Link href="/browse" className="text-accent mt-2 block hover:underline">Back to browse</Link></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <NotificationsPanel />

      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-ink-secondary">
          <Link href="/" className="hover:text-ink-primary">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-ink-primary">Browse</Link>
          {listing.category_name && (<><span>/</span><Link href={`/browse?category_id=${listing.category_id}`} className="hover:text-ink-primary">{listing.category_name}</Link></>)}
          <span>/</span>
          <span className="text-ink-primary line-clamp-1">{listing.title}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left — Images + Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="relative aspect-[4/3] bg-surface-100 rounded-2xl overflow-hidden">
                {previewImages[activeImg]?.cdn_url && !imgError[activeImg] ? (
                  <img src={previewImages[activeImg].cdn_url} alt={listing.title} className="w-full h-full object-cover" onError={() => setImgError(p => ({ ...p, [activeImg]: true }))} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageOff className="h-12 w-12 text-border" /></div>
                )}
                {previewImages.length > 1 && (
                  <>
                    <button onClick={() => setActiveImg(p => Math.max(0, p - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-lg p-1.5 shadow hover:bg-white transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setActiveImg(p => Math.min(previewImages.length - 1, p + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-lg p-1.5 shadow hover:bg-white transition-colors"><ChevronRight className="h-4 w-4" /></button>
                  </>
                )}
              </div>
              {previewImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previewImages.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImg(i)}
                      className={cn("shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all", i === activeImg ? "border-accent" : "border-transparent hover:border-border")}>
                      {img.cdn_url ? <img src={img.cdn_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-surface-100 flex items-center justify-center"><ImageOff className="h-4 w-4 text-border" /></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + Meta */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-ink-primary leading-snug">{listing.title}</h1>
                <button className="p-2 rounded-lg hover:bg-surface-50 text-ink-secondary shrink-0"><Share2 className="h-5 w-5" /></button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                {listing.avg_rating && listing.review_count > 0 && (
                  <StarRating rating={listing.avg_rating} showValue count={listing.review_count} size="md" />
                )}
                <span className="flex items-center gap-1 text-sm text-ink-secondary"><Eye className="h-4 w-4" />{listing.view_count?.toLocaleString()} views</span>
                <span className="flex items-center gap-1 text-sm text-ink-secondary"><Download className="h-4 w-4" />{listing.total_sales} sales</span>
                {listing.status !== "approved" && <StatusBadge status={listing.status} />}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Link href={`/seller/${listing.seller_username || listing.seller_id}`} className="flex items-center gap-2 group">
                  <Avatar src={listing.seller_avatar} name={listing.seller_name || "Seller"} size="sm" verified={listing.seller_verified} />
                  <div>
                    <p className="text-sm font-medium text-ink-primary group-hover:text-accent transition-colors">{listing.seller_name}</p>
                    {listing.seller_verified && <p className="text-xs text-success">Verified Seller</p>}
                  </div>
                </Link>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-ink-primary mb-3">About this listing</h2>
              <p className="text-sm text-ink-60 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Tags */}
            {listing.tags?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <Link key={tag} href={`/browse?tags=${tag}`} className="text-xs bg-surface-50 hover:bg-surface-100 text-ink-secondary px-3 py-1 rounded-full transition-colors">{tag}</Link>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibility */}
            {(listing.software_compat?.length > 0 || listing.file_formats?.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {listing.software_compat?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-ink-primary mb-2">Compatible With</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.software_compat.map((s) => <Badge key={s} color="brand" variant="ghost">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {listing.file_formats?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-ink-primary mb-2">File Formats</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.file_formats.map((f) => <Badge key={f} variant="outlined">{f}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — Purchase card */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              {/* Price */}
              <div className="mb-4">
                {selectedPrice ? (
                  <p className="text-3xl font-black text-ink-primary">{formatPrice(selectedPrice)}</p>
                ) : (
                  <p className="text-3xl font-black text-ink-primary">Contact seller</p>
                )}
                {listing.listing_type === "service" && (
                  <p className="text-xs text-ink-secondary mt-1">Custom project pricing</p>
                )}
              </div>

              {/* License selector */}
              {licenseOptions.length > 1 && (
                <Select label="License Type" options={licenseOptions}
                  value={selectedLicense}
                  onChange={(v) => setSelectedLicense(v as LicenseType)}
                  className="mb-4" />
              )}

              {/* License info */}
              <div className="bg-surface-50 rounded-xl p-3 mb-4 text-xs text-ink-secondary space-y-1">
                {selectedLicense === "personal" && <p>✓ Personal projects only — no commercial use</p>}
                {selectedLicense === "commercial" && <><p>✓ Commercial use allowed</p><p>✓ Single end product</p></>}
                {selectedLicense === "extended" && <><p>✓ Unlimited commercial use</p><p>✓ Multiple projects</p><p>✓ Resale rights</p></>}
              </div>

              <Button variant="accent" size="lg" fullWidth loading={createOrder.isPending}
                leftIcon={<ShoppingCart className="h-5 w-5" />} onClick={handleBuy}>
                {listing.listing_type === "service" ? "Request Service" : "Buy Now"}
              </Button>

              <Button variant="secondary" size="md" fullWidth className="mt-2" leftIcon={<Heart className="h-4 w-4" />}>
                Save to Wishlist
              </Button>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-xs text-ink-secondary"><Shield className="h-4 w-4 text-success shrink-0" /><span>7-day inspection period</span></div>
                <div className="flex items-center gap-2 text-xs text-ink-secondary"><Download className="h-4 w-4 text-info shrink-0" /><span>Instant download after purchase</span></div>
                <div className="flex items-center gap-2 text-xs text-ink-secondary"><Star className="h-4 w-4 text-warning shrink-0" /><span>Quality-verified by Desigot</span></div>
              </div>
            </Card>

            {/* Seller card */}
            <Card padding="sm">
              <div className="flex items-center gap-3 mb-3">
                <Link href={`/seller/${listing.seller_username || listing.seller_id}`}>
                  <Avatar src={listing.seller_avatar} name={listing.seller_name || "Seller"} size="md" verified={listing.seller_verified} />
                </Link>
                <div>
                  <Link href={`/seller/${listing.seller_username || listing.seller_id}`} className="text-sm font-semibold text-ink-primary hover:text-accent transition-colors">{listing.seller_name}</Link>
                  {(listing as unknown as { avg_seller_rating?: number })?.avg_seller_rating && <StarRating rating={(listing as unknown as { avg_seller_rating?: number })?.avg_seller_rating} showValue size="sm" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-ink-secondary">
                <div><span className="font-semibold text-ink-primary">{(listing as unknown as { seller_total_sales?: number })?.seller_total_sales || 0}</span> sales</div>
                {(listing as unknown as { response_rate?: number })?.response_rate && <div><span className="font-semibold text-ink-primary">{Math.round((listing as unknown as { response_rate?: number })?.response_rate * 100)}%</span> response</div>}
              </div>
              <Link href={`/seller/${listing.seller_username || listing.seller_id}`} className="flex items-center gap-1 mt-3 text-xs text-accent hover:underline">
                View profile <ExternalLink className="h-3 w-3" />
              </Link>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
