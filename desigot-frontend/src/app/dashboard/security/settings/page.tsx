"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SecuritySettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/security?tab=auth-settings");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
      Redirecting to Authentication & Security Policies...
    </div>
  );
}
