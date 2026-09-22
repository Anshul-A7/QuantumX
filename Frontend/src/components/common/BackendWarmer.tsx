"use client";

import { useEffect } from "react";
import { BackendWarmer } from "@/services/backend-warmer.service";

/**
 * Invisible root client component that wakes up the sleeping Render backend
 * as soon as any visitor lands anywhere on the website.
 */
export default function BackendWarmerComponent() {
  useEffect(() => {
    BackendWarmer.init();
  }, []);

  return null;
}
