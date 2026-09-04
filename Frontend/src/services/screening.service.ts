import { apiClient } from "@/lib/api";
import { NotificationService } from "./notification.service";

export interface StoredPrediction {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  diseaseType: string;
  disease?: string;
  cohort?: string;
  quantumPrediction: string;
  quantumRiskScore?: number;
  quantumConfidence: number;
  classicalPrediction: string;
  classicalRiskScore?: number;
  classicalConfidence: number;
  riskLevel: "High" | "Low" | "Borderline";
  topDriver?: string;
  topDriverImpact?: number;
  consensusStatus?: "Concordant" | "Discordant";
  quantumExecutionTimeMs?: number;
  classicalExecutionTimeMs?: number;
  inputFeatures?: Record<string, number>;
  gateAttributions?: Array<{ name: string; impact: number; description: string }>;
  clinicalNote?: string;
  createdAt?: string;
  timestamp?: string;
}

function getUserScreeningKey(): string {
  if (typeof window === "undefined") return "quantumx_user_screenings";
  const email = localStorage.getItem("quantumx_user_email") || "default";
  return `quantumx_screenings_${email}`;
}

export class ScreeningService {
  /**
   * Synchronously returns cached user screening records for instant 0ms render.
   */
  static getCachedScreenings(): StoredPrediction[] {
    if (typeof window === "undefined") return [];
    const storageKey = getUserScreeningKey();
    try {
      const local = localStorage.getItem(storageKey);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch persistent screening records strictly for the current authenticated user.
   * Leverages fast Stale-While-Revalidate pattern for instantaneous loading.
   */
  static async getScreenings(): Promise<StoredPrediction[]> {
    const storageKey = getUserScreeningKey();
    const cached = ScreeningService.getCachedScreenings();

    try {
      const response = await apiClient.get<StoredPrediction[]>("/screenings", {
        timeout: 4500,
      });
      if (response.data && Array.isArray(response.data)) {
        const records = response.data.map((s) => ({
          ...s,
          patientName: s.patientName || s.patientId,
          disease: s.disease || s.diseaseType || "Breast Cytology (Fine Needle Aspirate)",
          timestamp: s.createdAt
            ? new Date(s.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recent",
        }));

        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(records));
        }
        return records;
      }
    } catch {
      return cached;
    }

    return cached;
  }

  /**
   * Save a new screening record to the database for the current user.
   */
  static async createScreening(payload: Partial<StoredPrediction>): Promise<StoredPrediction> {
    const recordId = payload.id || payload.patientId || `QX-BC-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newRecord: StoredPrediction = {
      id: recordId,
      patientId: payload.patientId || recordId,
      patientName: payload.patientName || payload.patientId || "Patient",
      patientAge: payload.patientAge || 50,
      patientGender: payload.patientGender || "Female",
      diseaseType: payload.diseaseType || "Breast Cytology (Fine Needle Aspirate)",
      disease: payload.disease || "Breast Cancer Screening",
      cohort: payload.cohort || "Fine Needle Aspirate (WDBC)",
      quantumPrediction: payload.quantumPrediction || "Benign",
      quantumRiskScore: payload.quantumRiskScore ?? 40.0,
      quantumConfidence: payload.quantumConfidence ?? 50.0,
      classicalPrediction: payload.classicalPrediction || "Benign",
      classicalRiskScore: payload.classicalRiskScore ?? 40.0,
      classicalConfidence: payload.classicalConfidence ?? 70.0,
      riskLevel: payload.riskLevel || (payload.quantumPrediction === "Malignant" ? "High" : "Low"),
      topDriver: payload.topDriver || "Cell Size (Radius)",
      topDriverImpact: payload.topDriverImpact ?? 6.0,
      consensusStatus:
        payload.consensusStatus ||
        (payload.quantumPrediction === payload.classicalPrediction ? "Concordant" : "Discordant"),
      quantumExecutionTimeMs: payload.quantumExecutionTimeMs ?? 700.0,
      classicalExecutionTimeMs: payload.classicalExecutionTimeMs ?? 104.0,
      inputFeatures: payload.inputFeatures || {},
      clinicalNote: payload.clinicalNote || "",
      createdAt: new Date().toISOString(),
      timestamp: nowStr,
    };

    // Save to user-scoped localStorage
    if (typeof window !== "undefined") {
      try {
        const storageKey = getUserScreeningKey();
        const local = localStorage.getItem(storageKey);
        const list: StoredPrediction[] = local ? JSON.parse(local) : [];
        const filtered = list.filter((r) => r.id !== newRecord.id);
        localStorage.setItem(storageKey, JSON.stringify([newRecord, ...filtered]));
      } catch (e) {
        console.warn("Could not save screening to localStorage:", e);
      }
    }

    // Persist to backend database (Supabase)
    try {
      await apiClient.post("/screenings", newRecord);
    } catch {}

    // Dispatch persistent clinical notification
    try {
      await NotificationService.createNotification({
        id: `notif-${recordId}`,
        title: `Screening Completed: ${newRecord.patientName}`,
        category: "disease",
        message: `${newRecord.disease || "Breast Cancer Screening"} result: ${newRecord.quantumPrediction} (${newRecord.riskLevel} Risk) (${(newRecord.quantumConfidence || 90).toFixed(1)}% confidence).`,
        actionUrl: "/history",
      });
    } catch {}

    return newRecord;
  }

  /**
   * Clears all screening history records for the current user.
   */
  static async clearAllScreenings(): Promise<void> {
    if (typeof window !== "undefined") {
      const storageKey = getUserScreeningKey();
      localStorage.removeItem(storageKey);
      localStorage.removeItem("quantumx_prediction_history");
    }
    try {
      await apiClient.delete("/screenings");
    } catch {}
  }
}
