"use client";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { SellerSidebar } from "@/components/layout/SellerSidebar";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <NotificationsPanel />
      <div className="flex h-[calc(100vh-64px)]">
        <SellerSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
