"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AccountBookingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/orders-bookings/all");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3" />
      <p className="text-sm text-slate-400 font-medium">Navigating to Dashboard Bookings...</p>
    </div>
  );
}
