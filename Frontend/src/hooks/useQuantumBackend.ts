"use client";

import { useState, useEffect, useCallback } from "react";

export type QuantumBackendType = "ibmq_eagle" | "gpu_simulator";

const STORAGE_KEY = "quantumx_backend";
const EVENT_NAME = "quantumx_backend_change";

export function useQuantumBackend() {
  const [backend, setBackendState] = useState<QuantumBackendType>("ibmq_eagle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as QuantumBackendType | null;
      if (stored === "gpu_simulator" || stored === "ibmq_eagle") {
        setBackendState(stored);
      } else {
        localStorage.setItem(STORAGE_KEY, "ibmq_eagle");
      }

      const handleCustomEvent = (e: Event) => {
        const customEvent = e as CustomEvent<QuantumBackendType>;
        if (customEvent.detail === "gpu_simulator" || customEvent.detail === "ibmq_eagle") {
          setBackendState(customEvent.detail);
        }
      };

      const handleStorageEvent = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && (e.newValue === "gpu_simulator" || e.newValue === "ibmq_eagle")) {
          setBackendState(e.newValue as QuantumBackendType);
        }
      };

      window.addEventListener(EVENT_NAME, handleCustomEvent);
      window.addEventListener("storage", handleStorageEvent);

      return () => {
        window.removeEventListener(EVENT_NAME, handleCustomEvent);
        window.removeEventListener("storage", handleStorageEvent);
      };
    }
  }, []);

  const setBackend = useCallback((newBackend: QuantumBackendType) => {
    setBackendState(newBackend);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newBackend);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newBackend }));
    }
  }, []);

  return { backend, setBackend };
}
