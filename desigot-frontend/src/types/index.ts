// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  role: "buyer" | "seller" | "admin" | "superadmin";
  account_status: "active" | "suspended" | "banned" | "pending_verification";
  seller_verified: boolean;
  seller_type?: "freelancer" | "agency" | "studio";
  response_rate?: number;
  total_sales: number;
  avg_seller_rating?: number;
  seller_review_count: number;
  email_verified_at?: string;
  created_at: string;
  last_seen_at?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

// ── Listings ──────────────────────────────────────────────────────────────────
export type ListingStatus = "draft" | "pending_review" | "approved" | "rejected" | "paused" | "archived";
export type ListingType   = "asset" | "service";
export type LicenseType   = "personal" | "commercial" | "extended";

export interface Listing {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  listing_type: ListingType;
  status: ListingStatus;
  price_personal?: number;
  price_commercial?: number;
  price_extended?: number;
  currency: string;
  ai_quality_score?: number;
  total_sales: number;
  avg_rating?: number;
  review_count: number;
  view_count: number;
  wishlist_count: number;
  is_featured: boolean;
  tags: string[];
  software_compat: string[];
  file_formats: string[];
  created_at: string;
  published_at?: string;
  rejection_reason?: string;
  // Joined
  seller_name?: string;
  seller_username?: string;
  seller_avatar?: string;
  seller_verified?: boolean;
  category_name?: string;
  category_slug?: string;
  primary_image?: string;
  media?: ListingMedia[];
}

export interface ListingMedia {
  id: string;
  media_type: "preview_image" | "delivery_file" | "video" | "portfolio_item";
  cdn_url?: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  width_px?: number;
  height_px?: number;
  sort_order: number;
  is_watermarked: boolean;
  virus_scan_status: "pending" | "clean" | "infected" | "skipped";
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  cover_image_url?: string;
  sort_order: number;
  listing_count: number;
  depth: number;
  is_active: boolean;
  children?: Category[];
}

export interface ListingCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  is_active: boolean;
  listing_count?: number;
  listings?: Listing[];
}

// ── Orders ────────────────────────────────────────────────────────────────────
export type OrderStatus = "pending" | "active" | "complete" | "disputed" | "refunded" | "cancelled";

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  listing_title: string;
  listing_type: ListingType;
  license_type: LicenseType;
  amount_cents: number;
  discount_cents: number;
  platform_fee_cents: number;
  seller_payout_cents: number;
  currency: string;
  status: OrderStatus;
  promo_code_used?: string;
  inspection_ends_at: string;
  download_expires_at: string;
  created_at: string;
  completed_at?: string;
  escrow_status?: string;
  buyer_name?: string;
  seller_name?: string;
  listing_slug?: string;
}

export interface License {
  id: string;
  order_id: string;
  buyer_id: string;
  listing_id: string;
  license_type: LicenseType;
  license_key: string;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  title?: string;
  slug?: string;
}

// ── Projects ──────────────────────────────────────────────────────────────────
export type ProjectStatus = "briefing" | "proposal" | "active" | "in_revision" | "complete" | "cancelled" | "disputed";
export type MilestoneStatus = "not_started" | "in_progress" | "submitted" | "approved" | "paid" | "disputed";

export interface Project {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  deadline?: string;
  revision_limit: number;
  revisions_used: number;
  total_budget_cents: number;
  created_at: string;
  buyer_name?: string;
  seller_name?: string;
  buyer_avatar?: string;
  seller_avatar?: string;
  milestones?: Milestone[];
  files?: ProjectFile[];
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  amount_cents: number;
  status: MilestoneStatus;
  due_date?: string;
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
  sort_order: number;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  version_label: string;
  version_notes?: string;
  created_at: string;
  uploaded_by_name?: string;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  message_type: "text" | "file" | "system_event" | "milestone_update";
  content?: string;
  file_name?: string;
  is_pinned: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  subject_id: string;
  listing_id: string;
  review_type: "buyer_review" | "seller_review";
  rating_overall: number;
  rating_quality?: number;
  rating_communication?: number;
  rating_value?: number;
  rating_delivery?: number;
  review_text: string;
  status: "pending_moderation" | "approved" | "rejected" | "hidden";
  published_at?: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  listing_title?: string;
  response_text?: string;
  response_at?: string;
}

// ── Payments ──────────────────────────────────────────────────────────────────
export interface SellerBalance {
  seller_id: string;
  available_cents: number;
  pending_escrow_cents: number;
  lifetime_earned_cents: number;
  lifetime_withdrawn_cents: number;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount_cents: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  scheduled_for: string;
  processed_at?: string;
  method_type?: string;
  display_name?: string;
  created_at: string;
}

export interface SellerPlan {
  id: string;
  name: "free" | "pro" | "agency" | "enterprise";
  display_name: string;
  price_monthly_cents: number;
  price_yearly_cents?: number;
  commission_rate: number;
  max_active_listings?: number;
  search_boost_pct: number;
  has_ai_optimizer: boolean;
  has_custom_storefront: boolean;
  has_api_access: boolean;
  has_dedicated_cxm: boolean;
  features: string[];
}

export interface Subscription {
  id: string;
  seller_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "past_due" | "trialing" | "paused";
  billing_cycle: "monthly" | "yearly";
  current_period_end: string;
  plan_name?: string;
  display_name?: string;
  commission_rate?: number;
  features?: string[];
}

// ── Disputes ──────────────────────────────────────────────────────────────────
export interface Dispute {
  id: string;
  order_id: string;
  opened_by_id: string;
  status: "open" | "under_review" | "resolved" | "cancelled";
  reason: string;
  description: string;
  outcome?: "full_refund" | "partial_refund" | "no_refund";
  opened_at: string;
  sla_deadline: string;
  resolved_at?: string;
  listing_title?: string;
  amount_cents?: number;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface SellerAnalytics {
  summary: {
    total_orders: number;
    total_gmv: number;
    total_earnings: number;
    orders_period: number;
  };
  daily_revenue: { day: string; earnings: number; order_count: number }[];
  listings: { total: number; approved: number; pending: number };
  reviews: { avg_rating: number; total_reviews: number };
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchFilters {
  q?: string;
  category_id?: string;
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  tags?: string;
  software?: string;
  file_format?: string;
  sort?: "relevance" | "newest" | "popular" | "rating" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface ListingFacetOption {
  value: string;
  label?: string;
  listing_count?: number;
}

export interface ListingFacets {
  software: ListingFacetOption[];
  file_formats: ListingFacetOption[];
  listing_types: ListingFacetOption[];
  sort_options: ListingFacetOption[];
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  is_shared: boolean;
  share_token?: string;
  created_at: string;
  items?: Listing[];
  item_count?: number;
}

// Extended listing type with all join fields returned from API
export interface ListingWithSellerDetails extends Listing {
  avg_seller_rating?: number;
  seller_total_sales?: number;
  response_rate?: number;
}
