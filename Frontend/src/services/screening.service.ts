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
  modelFamily?: string;
  executionMode?: string;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records: StoredPrediction[] = response.data.map((s: any) => ({
          id: s.id || s.patientId || s.patient_id,
          patientId: s.patientId || s.patient_id || s.id,
          patientName: s.patientName || s.patient_name || s.patientId || s.patient_id || "Patient",
          patientAge: s.patientAge ?? s.patient_age ?? 50,
          patientGender: s.patientGender || s.patient_gender || "Female",
          diseaseType: s.diseaseType || s.disease_type || "Breast Cytology (Fine Needle Aspirate)",
          disease: s.disease || s.diseaseType || s.disease_type || "Breast Cancer Screening",
          cohort: s.cohort || "Fine Needle Aspirate (WDBC)",
          quantumPrediction: s.quantumPrediction || s.quantum_prediction || "Benign",
          quantumRiskScore: Number(s.quantumRiskScore ?? s.risk_score ?? s.riskScore ?? 42.4),
          quantumConfidence: Number(s.quantumConfidence ?? s.quantum_confidence ?? 50.0),
          classicalPrediction: s.classicalPrediction || s.classical_prediction || "Benign",
          classicalRiskScore: Number(s.classicalRiskScore ?? s.risk_score ?? s.riskScore ?? 44.1),
          classicalConfidence: Number(s.classicalConfidence ?? s.classical_confidence ?? 70.0),
          riskLevel: s.riskLevel || s.risk_level || "Low",
          topDriver: s.topDriver || s.top_driver || "Cell Size (Radius)",
          topDriverImpact: Number(s.topDriverImpact ?? 6.0),
          consensusStatus:
            s.consensusStatus ||
            ((s.quantumPrediction || s.quantum_prediction) === (s.classicalPrediction || s.classical_prediction)
              ? "Concordant"
              : "Discordant"),
          quantumExecutionTimeMs: Number(s.quantumExecutionTimeMs ?? s.quantum_execution_time_ms ?? 700.0),
          classicalExecutionTimeMs: Number(s.classicalExecutionTimeMs ?? s.classical_execution_time_ms ?? 104.0),
          inputFeatures: s.inputFeatures || s.input_features || {},
          gateAttributions: s.gateAttributions || s.gate_attributions || [],
          clinicalNote: s.clinicalNote || s.clinical_note || "",
          createdAt: s.createdAt || s.created_at || new Date().toISOString(),
          timestamp:
            s.createdAt || s.created_at
              ? new Date(s.createdAt || s.created_at).toLocaleDateString([], {
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
    } catch (err) {
      console.warn("Could not fetch screenings from remote server:", err);
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
      modelFamily: payload.modelFamily || "aegis_classical_v1",
      executionMode: payload.executionMode || "hybrid_quantum_simulator",
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

    // Save to user-scoped localStorage for instantaneous UI updates
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
      const backendPayload = {
        id: newRecord.id,
        patient_id: newRecord.patientId,
        patient_name: newRecord.patientName,
        patient_age: newRecord.patientAge,
        patient_gender: newRecord.patientGender,
        disease_type: newRecord.diseaseType || newRecord.disease || "Breast Cytology (Fine Needle Aspirate)",
        model_family: newRecord.modelFamily || "aegis_classical_v1",
        execution_mode: newRecord.executionMode || "hybrid_quantum_simulator",
        quantum_prediction: newRecord.quantumPrediction,
        quantum_confidence: newRecord.quantumConfidence,
        classical_prediction: newRecord.classicalPrediction,
        classical_confidence: newRecord.classicalConfidence,
        risk_level: newRecord.riskLevel,
        risk_score: newRecord.quantumRiskScore ?? newRecord.classicalRiskScore ?? 40.0,
        top_driver: newRecord.topDriver,
        quantum_execution_time_ms: newRecord.quantumExecutionTimeMs,
        classical_execution_time_ms: newRecord.classicalExecutionTimeMs,
        input_features: newRecord.inputFeatures,
        gate_attributions: newRecord.gateAttributions,
        clinical_note: newRecord.clinicalNote,
      };

      await apiClient.post("/screenings", backendPayload);
    } catch (err) {
      console.warn("Could not persist screening record to backend:", err);
    }

    // Dispatch persistent clinical notification
    try {
      await NotificationService.createNotification({
        id: `notif-${recordId}`,
        title: `Screening Completed: ${newRecord.patientName}`,
        category: "disease",
        message: `${newRecord.disease || "Breast Cancer Screening"} result: ${newRecord.quantumPrediction} (${newRecord.riskLevel} Risk) (${(newRecord.quantumConfidence || 90).toFixed(1)}% confidence).`,
        actionUrl: "/history",
      });
    } catch (err) {
      console.warn("Could not create screening notification:", err);
    }

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
    } catch (err) {
      console.warn("Could not delete screenings from backend:", err);
    }
  }
}
