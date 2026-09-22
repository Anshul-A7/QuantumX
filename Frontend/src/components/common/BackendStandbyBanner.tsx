"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useBackendStatus } from "@/services/backend-warmer.service";
import { CheckCircle2 } from "lucide-react";

/**
 * BackendStandbyBanner
 * ----------------------------------------------------------------------------
 * Strict Lifecycle Rules:
 * 1. If Render backend is ALREADY ON or woken up: NEVER EVER SHOWN (0 flash, 0 ms).
 * 2. ONLY shown when Render backend is genuinely sleeping / booting up from standby.
 * 3. Once it fully wakes up: message transitions to:
 *    "Apologies, system online. You may begin."
 * 4. Within exactly 1 second (1000ms), it smoothly fades away and unmounts permanently.
 */
export default function BackendStandbyBanner() {
  const { isOnline, isRenderSleeping, isRenderLive } = useBackendStatus();

  // Tracks if the server was confirmed sleeping/off during this session
  const [wasSleeping, setWasSleeping] = useState(false);
  // Tracks if the server has transitioned to online and is showing the success confirmation
  const [isWokenSuccess, setIsWokenSuccess] = useState(false);
  // Tracks if the banner has completed its lifecycle and permanently vanished
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("quantumx_standby_dismissed") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  // If server is confirmed sleeping on live platform, activate sleeping tracker
  useEffect(() => {
    if (isRenderLive && isRenderSleeping && !isOnline && !isDismissed) {
      setWasSleeping(true);
    }
  }, [isRenderLive, isRenderSleeping, isOnline, isDismissed]);

  // When a sleeping server finally wakes up, transition to ready message and vanish in 1 second
  useEffect(() => {
    if (wasSleeping && isOnline && !isDismissed) {
      setIsWokenSuccess(true);
      const timer = setTimeout(() => {
        setIsDismissed(true);
        try {
          sessionStorage.setItem("quantumx_standby_dismissed", "true");
        } catch {}
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [wasSleeping, isOnline, isDismissed]);

  // 1. If dismissed or not a remote live platform: NEVER SHOW
  if (isDismissed || !isRenderLive) return null;
  // 2. If server was ALREADY on from the start: NEVER SHOW
  if (!wasSleeping && isOnline) return null;
  // 3. If probing and not yet confirmed sleeping: DO NOT SHOW
  if (!wasSleeping && !isRenderSleeping) return null;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -6 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="my-2.5 flex justify-center overflow-hidden"
        >
          {isWokenSuccess ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[11px] font-medium shadow-xs">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>Apologies, system online. You may begin.</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[11px] font-medium shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Cloud Instance: Booting up from standby (free tier)</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
