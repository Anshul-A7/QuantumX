"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function VerifyOtpRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/verify-email?${query}` : "/verify-email");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader2 className="animate-spin text-ink" size={32} />
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-ink" size={32} />
      </div>
    }>
      <VerifyOtpRedirect />
    </Suspense>
  );
}

