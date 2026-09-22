"use client";

// ============================================================================
// QUANTUMX — CLOUD BACKEND WARMER & COLD-START ORCHESTRATOR
// ============================================================================
// Proactively sends wake-up heartbeats to the Render cloud backend upon site entry.
// Tracks cold-start boot duration and notifies components ONLY when the remote
// free-tier cloud container is genuinely sleeping. NEVER triggers on localhost
// or when the backend is already healthy.
// ============================================================================

import { useEffect, useState } from "react";

export interface BackendStatus {
  isOnline: boolean;
  isWaking: boolean;
  wakeTimeSeconds: number;
  lastChecked: number | null;
  error: string | null;
  isRenderLive: boolean;
  isRenderSleeping: boolean;
}

type StatusListener = (status: BackendStatus) => void;

/**
 * Checks whether the current environment is targeting a remote Render cloud host.
 * Returns false on localhost / 127.0.0.1 or when running against a local backend.
 */
export function isLiveRenderPlatform(): boolean {
  if (typeof window === "undefined") return false;
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").toLowerCase();
  const isRenderUrl = apiUrl.includes("onrender.com") || apiUrl.includes("render.com");
  const hostname = window.location.hostname.toLowerCase();
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local") ||
    apiUrl.includes("localhost") ||
    apiUrl.includes("127.0.0.1");

  return isRenderUrl || (!isLocalHost && apiUrl.startsWith("https://"));
}

class BackendWarmerService {
  private static instance: BackendWarmerService;
  private status: BackendStatus = {
    isOnline: false,
    isWaking: false,
    wakeTimeSeconds: 0,
    lastChecked: null,
    error: null,
    isRenderLive: false,
    isRenderSleeping: false,
  };
  private listeners: Set<StatusListener> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.status.isRenderLive = isLiveRenderPlatform();
    }
  }

  public static getInstance(): BackendWarmerService {
    if (!BackendWarmerService.instance) {
      BackendWarmerService.instance = new BackendWarmerService();
    }
    return BackendWarmerService.instance;
  }

  public getStatus(): BackendStatus {
    return { ...this.status };
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error("[BackendWarmer] Listener error:", err);
      }
    });
  }

  /**
   * Initializes automatic background wake-up and continuous keep-alive heartbeats.
   */
  public init(): void {
    if (typeof window === "undefined" || this.isInitialized) return;
    this.isInitialized = true;
    this.status.isRenderLive = isLiveRenderPlatform();

    // Immediately trigger wake-up ping
    this.ping();

    // Keep backend warm every 45 seconds while user is on site
    this.heartbeatInterval = setInterval(() => {
      this.ping();
    }, 45000);
  }

  /**
   * Ping backend root or /health endpoint
   */
  public async ping(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const isLive = isLiveRenderPlatform();
    this.status.isRenderLive = isLive;

    // Only start a cold-boot wake timer if we are actually targeting remote Render
    if (isLive && !this.status.isOnline) {
      if (!this.timerInterval) {
        this.status.isWaking = true;
        this.status.wakeTimeSeconds = 0;
        this.status.isRenderSleeping = false; // Only mark sleeping if delay exceeds threshold
        this.notify();

        this.timerInterval = setInterval(() => {
          this.status.wakeTimeSeconds += 1;
          // Genuine cold start: If remote ping takes >= 6 seconds, Render is cold/sleeping
          if (this.status.wakeTimeSeconds >= 6 && !this.status.isOnline) {
            this.status.isRenderSleeping = true;
          }
          this.notify();
        }, 1000);
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const res = await fetch(`${apiUrl}/health`, {
        method: "GET",
        mode: "cors",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        this.clearTimer();
        this.status.isOnline = true;
        this.status.isWaking = false;
        this.status.isRenderSleeping = false;
        this.status.lastChecked = Date.now();
        this.status.error = null;
        this.notify();
        return true;
      } else {
        throw new Error(`Health check status: ${res.status}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Connection failed";
      this.status.lastChecked = Date.now();
      this.status.error = errorMsg;
      // On live Render, a connection failure while waiting confirms container is spinning up
      if (isLive) {
        this.status.isWaking = true;
        this.status.isRenderSleeping = true;
      } else {
        this.status.isWaking = false;
        this.status.isRenderSleeping = false;
      }
      this.notify();
      return false;
    }
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public destroy(): void {
    this.clearTimer();
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const BackendWarmer = BackendWarmerService.getInstance();

/**
 * React hook to observe real-time backend wake-up state
 */
export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>(BackendWarmer.getStatus());

  useEffect(() => {
    const unsubscribe = BackendWarmer.subscribe(setStatus);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...status,
    pingNow: () => BackendWarmer.ping(),
  };
}
