"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AccountMessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/communication/conversations");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3" />
      <p className="text-sm text-slate-400 font-medium">Navigating to Dashboard Messages...</p>
    </div>
  );
}
