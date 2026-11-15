"use client";

import React, { useEffect, useState } from "react";
import { X, FileText, Download, Printer, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { apiGet } from "@/lib/api";
import { TransactionStatusBadge } from "./TransactionStatusBadge";

interface Props {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoicePreviewModal({ invoiceId, isOpen, onClose }: Props) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (invoiceId && isOpen) {
      setLoading(true);
      apiGet<any>(`/admin/finance/invoices/${invoiceId}`)
        .then((res) => {
          setInvoice(res);
        })
        .catch((err) => {
          console.error("Failed to load invoice:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setInvoice(null);
    }
  }, [invoiceId, isOpen]);

  if (!isOpen) return null;

  const formatCents = (cents: number) => {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Modal Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Marketplace Official Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-xs">Generating invoice statement...</p>
          </div>
        ) : !invoice ? (
          <div className="py-12 text-center text-slate-400 text-xs">Invoice not found.</div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-6 text-xs text-slate-300">
            {/* Invoice Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-xs">
                    D
                  </div>
                  <span className="font-extrabold text-base tracking-wider text-white">DESIGOT</span>
                </div>
                <p className="text-[11px] text-slate-400">Global UI/UX Design Marketplace Inc.</p>
                <p className="text-[11px] text-slate-500">100 Silicon Way, Tech District, CA 94107</p>
                <p className="text-[11px] text-slate-500">Tax ID: US-948201934-EX</p>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Invoice Statement</span>
                <h4 className="text-base font-bold text-white font-mono">{invoice.invoice_number}</h4>
                <div className="pt-1">
                  <TransactionStatusBadge status={invoice.status} />
                </div>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Billed To (Client):</span>
                <p className="text-white font-semibold">{invoice.customer_name || "Enterprise Client"}</p>
                <p className="text-[11px] text-slate-400">{invoice.customer_email}</p>
                <p className="text-[11px] text-slate-500">Global Design Buyer Account</p>
              </div>

              <div className="text-right space-y-1">
                <div>
                  <span className="text-slate-500">Invoice Date: </span>
                  <span className="text-slate-200">
                    {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Due Date: </span>
                  <span className="text-slate-200">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Provider Ref: </span>
                  <span className="text-purple-300 font-mono text-[11px]">
                    {invoice.transaction_reference || "Direct Settlement"}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
                  <tr>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {invoice.line_items && Array.isArray(invoice.line_items) && invoice.line_items.length > 0 ? (
                    invoice.line_items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 text-white font-medium">{item.item || "Design Asset & License"}</td>
                        <td className="py-3 text-center text-slate-400">{item.qty || 1}</td>
                        <td className="py-3 text-right font-mono text-slate-300">
                          {formatCents(item.unit_cents || invoice.subtotal_cents)}
                        </td>
                        <td className="py-3 text-right font-mono text-white font-semibold">
                          {formatCents(item.unit_cents || invoice.subtotal_cents)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 text-white font-medium">UI/UX Sprint Deliverable & Production Assets</td>
                      <td className="py-3 text-center text-slate-400">1</td>
                      <td className="py-3 text-right font-mono text-slate-300">{formatCents(invoice.subtotal_cents)}</td>
                      <td className="py-3 text-right font-mono text-white font-semibold">
                        {formatCents(invoice.subtotal_cents)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">{formatCents(invoice.subtotal_cents)}</span>
                </div>
                {invoice.discount_cents > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCents(invoice.discount_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Sales Tax (8.25%):</span>
                  <span className="font-mono text-slate-200">{formatCents(invoice.tax_cents)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-800 text-sm font-bold text-white">
                  <span>Total Due:</span>
                  <span className="font-mono text-emerald-400">{formatCents(invoice.total_cents)}</span>
                </div>
              </div>
            </div>

            {/* Terms Footer */}
            <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
              <p>Terms: Standard 14-day settlement period. Deliverables licensed under Desigot Commercial License.</p>
              <p>For questions or accounting inquiries, contact finance@desigot.com.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
