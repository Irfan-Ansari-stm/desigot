"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginHistoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/security?tab=login-history");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
      Redirecting to Security & Audit Center...
    </div>
  );
}
