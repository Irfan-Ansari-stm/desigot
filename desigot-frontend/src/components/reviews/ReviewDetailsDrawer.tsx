"use strict";
import React, { useState } from "react";
import {
  X,
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  AlertTriangle,
  FileText,
  Clock,
  User,
  ShoppingBag,
  Paperclip,
  ExternalLink,
  MessageSquare,
  History,
  Send,
  Flag
} from "lucide-react";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { ReviewStatusBadge, RiskScoreBadge, VerifiedPurchaseBadge } from "./ReviewStatusBadge";

interface ReviewDetailsDrawerProps {
  review: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, reason: string, note?: string) => Promise<void>;
  onHide: (id: string, reason: string) => Promise<void>;
  onRestore: (id: string, reason: string) => Promise<void>;
}

export const ReviewDetailsDrawer: React.FC<ReviewDetailsDrawerProps> = ({
  review,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onHide,
  onRestore
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "response" | "reports" | "audit">("details");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen || !review) return null;

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await onApprove(review.id, "Approved from review details drawer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await onReject(review.id, rejectReason, rejectNote);
      setRejectModalOpen(false);
      setRejectReason("");
      setRejectNote("");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      setActionLoading(true);
      if (review.visibility_status === "visible" && review.status === "approved") {
        await onHide(review.id, "Administratively hidden via review drawer.");
      } else {
        await onRestore(review.id, "Administratively restored to active via review drawer.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                {review.review_reference || `REV-${review.id.slice(0, 8).toUpperCase()}`}
              </span>
              <ReviewStatusBadge status={review.status} />
              {review.is_verified_purchase && <VerifiedPurchaseBadge />}
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mt-1.5 truncate max-w-md">
              {review.title || review.item_title || "Marketplace Review"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "details"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Review & Item
          </button>
          <button
            onClick={() => setActiveTab("response")}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "response"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Seller Response ({review.responses?.length || (review.seller_response ? 1 : 0)})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Flag className="w-4 h-4" />
            Reports ({review.reports?.length || review.reported_count || 0})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            Audit History ({review.audit_actions?.length || 0})
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "details" && (
            <>
              {/* Ratings and dimensional scorecards */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {review.rating_overall}.0
                    </span>
                    <ReviewRatingStars rating={review.rating_overall} size="md" />
                  </div>
                  <RiskScoreBadge score={review.risk_score || 0.05} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Quality</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {review.rating_quality || review.rating_overall} / 5
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Communication</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {review.rating_communication || review.rating_overall} / 5
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Value</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {review.rating_value || review.rating_overall} / 5
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Delivery</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {review.rating_delivery || review.rating_overall} / 5
                    </span>
                  </div>
                </div>
              </div>

              {/* Review text */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  Review Content
                </h3>
                {review.title && (
                  <p className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    "{review.title}"
                  </p>
                )}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {review.review_text}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>Helpful: {review.helpful_count || 0}</span>
                  <span>Unhelpful: {review.unhelpful_count || 0}</span>
                  <span>Submitted: {new Date(review.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Attachments */}
              {review.attachments && review.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-purple-600" />
                    Customer Attachments ({review.attachments.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {review.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="group relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800/50 cursor-pointer"
                        onClick={() => setPreviewImage(att.file_url)}
                      >
                        {att.file_type?.startsWith("image") ? (
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            className="w-full h-24 object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-24 flex flex-col items-center justify-center p-2 text-center text-xs text-slate-500">
                            <FileText className="w-6 h-6 mb-1 text-purple-500" />
                            <span className="truncate w-full">{att.file_name}</span>
                          </div>
                        )}
                        <div className="p-1.5 bg-white/90 dark:bg-slate-900/90 text-[10px] text-slate-600 dark:text-slate-400 truncate">
                          {att.file_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer & Seller Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Customer / Reviewer
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      {review.customer_first_name?.[0] || "U"}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {review.customer_first_name} {review.customer_last_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {review.customer_email || "customer@desigot.com"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Seller / Recipient
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                      {review.seller_first_name?.[0] || "S"}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {review.seller_first_name} {review.seller_last_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {review.seller_email || "seller@desigot.com"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Item Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Item Purchased
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {review.item_title || "Marketplace Listing"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {review.item_type || "product"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rejection / Moderator note if present */}
              {review.rejection_reason && (
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Rejection Reason
                  </span>
                  <p className="text-rose-600 dark:text-rose-300">{review.rejection_reason}</p>
                </div>
              )}
              {review.moderator_notes && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Moderator Notes
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">{review.moderator_notes}</p>
                </div>
              )}
            </>
          )}

          {activeTab === "response" && (
            <div className="space-y-4">
              {review.responses && review.responses.length > 0 ? (
                review.responses.map((resp: any) => (
                  <div
                    key={resp.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          Seller Response
                        </span>
                        <ReviewStatusBadge status={resp.status} size="sm" />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(resp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      {resp.response_text}
                    </p>
                  </div>
                ))
              ) : review.seller_response ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      Seller Response
                    </span>
                    <ReviewStatusBadge status={review.seller_response.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    {review.seller_response.response_text}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No seller response submitted for this review yet.
                </div>
              )}
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-3">
              {review.reports && review.reports.length > 0 ? (
                review.reports.map((rep: any) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                        {rep.report_reference}
                      </span>
                      <ReviewStatusBadge status={rep.status} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Reason: {rep.reason}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      {rep.description || "No description provided."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No reports or flags filed against this review.
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-3">
              {review.audit_actions && review.audit_actions.length > 0 ? (
                review.audit_actions.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 mt-0.5">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white capitalize">
                          {act.action_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        {act.reason || "Action logged by administrator"}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        By: {act.mod_first_name} {act.mod_last_name} ({act.mod_email})
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No audit history records found for this review.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action toolbar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {review.status !== "approved" && (
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Review
              </button>
            )}

            {review.status !== "rejected" && (
              <button
                disabled={actionLoading}
                onClick={() => setRejectModalOpen(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-medium text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            )}

            <button
              disabled={actionLoading}
              onClick={handleToggleVisibility}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {review.visibility_status === "visible" && review.status === "approved" ? (
                <>
                  <EyeOff className="w-4 h-4 text-slate-500" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-emerald-500" />
                  Restore
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Reject Review
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Please specify the policy violation reason. This will be recorded in the audit trail and provided to the reviewer.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rejection Reason *
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Contains offensive language / competitor sabotage"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Internal Moderator Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Additional context for internal staff..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim() || actionLoading}
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-3xl max-h-[85vh] relative">
            <img
              src={previewImage}
              alt="Attachment preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-white text-slate-900 rounded-full shadow-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
