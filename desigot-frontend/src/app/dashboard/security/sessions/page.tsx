"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SessionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/security?tab=sessions");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
      Redirecting to Active Sessions Monitor...
    </div>
  );
}
