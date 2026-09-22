"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChronicKidneyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/predict/neurological");
  }, [router]);
  return null;
}
