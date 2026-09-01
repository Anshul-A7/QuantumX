import { apiClient } from "@/lib/api";

export interface StoredPrediction {
  id: string;
  patientId: string;
  patientName?: string;
  diseaseType: string;
  disease?: string;
  quantumPrediction: string;
  quantumConfidence: number;
  classicalPrediction: string;
  classicalConfidence: number;
  riskLevel: "High" | "Low";
  topDriver?: string;
  quantumExecutionTimeMs?: number;
  classicalExecutionTimeMs?: number;
  inputFeatures?: Record<string, number>;
  gateAttributions?: Array<{ name: string; impact: number; description: string }>;
  clinicalNote?: string;
  createdAt?: string;
  timestamp?: string;
}

export class ScreeningService {
  /**
   * Fetch real screening records from Supabase via backend API.
   */
  static async getScreenings(): Promise<StoredPrediction[]> {
    try {
      const response = await apiClient.get<StoredPrediction[]>("/screenings");
      const mapped = (response.data || []).map((s) => ({
        ...s,
        patientName: s.patientId,
        disease: s.diseaseType,
        timestamp: s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now",
      }));
      // Sync with localStorage for offline fast fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("quantumx_prediction_history", JSON.stringify(mapped));
      }
      return mapped;
    } catch {
      // Fallback to local storage if network is offline
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("quantumx_prediction_history");
        return local ? JSON.parse(local) : [];
      }
      return [];
    }
  }

  /**
   * Save a new screening record directly to Supabase.
   */
  static async createScreening(payload: {
    id?: string;
    patientId: string;
    diseaseType: string;
    quantumPrediction: string;
    quantumConfidence: number;
    classicalPrediction: string;
    classicalConfidence: number;
    riskLevel: "High" | "Low";
    topDriver?: string;
    quantumExecutionTimeMs?: number;
    classicalExecutionTimeMs?: number;
    inputFeatures?: Record<string, number>;
    gateAttributions?: Array<{ name: string; impact: number; description: string }>;
    clinicalNote?: string;
  }): Promise<StoredPrediction> {
    try {
      const response = await apiClient.post<StoredPrediction>("/screenings", payload);
      const saved = {
        ...response.data,
        patientName: response.data.patientId,
        disease: response.data.diseaseType,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      if (typeof window !== "undefined") {
        const local = localStorage.getItem("quantumx_prediction_history");
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem("quantumx_prediction_history", JSON.stringify([saved, ...list].slice(0, 50)));
      }

      return saved;
    } catch {
      // Fallback save to local storage
      const fallback: StoredPrediction = {
        ...payload,
        id: payload.id || `QX-${Math.floor(10000 + Math.random() * 90000)}`,
        patientName: payload.patientId,
        disease: payload.diseaseType,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("quantumx_prediction_history");
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem("quantumx_prediction_history", JSON.stringify([fallback, ...list].slice(0, 50)));
      }
      return fallback;
    }
  }

  /**
   * Delete a screening record by ID from Supabase.
   */
  static async deleteScreening(id: string): Promise<void> {
    try {
      await apiClient.delete(`/screenings/${id}`);
    } catch {}
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("quantumx_prediction_history");
      if (local) {
        const list = JSON.parse(local) as StoredPrediction[];
        localStorage.setItem(
          "quantumx_prediction_history",
          JSON.stringify(list.filter((s) => s.id !== id))
        );
      }
    }
  }

  /**
   * Clear all screening records for this user from Supabase.
   */
  static async clearAllScreenings(): Promise<void> {
    try {
      await apiClient.delete("/screenings");
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("quantumx_prediction_history");
    }
  }
}
