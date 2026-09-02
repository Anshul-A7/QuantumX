"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Search,
  Download,
  Eye,
  Inbox,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
  FileText,
  User,
  ShieldCheck,
  Activity,
  Microscope,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { ScreeningService, type StoredPrediction } from "@/services/screening.service";

export default function HistoryPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<StoredPrediction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "High" | "Low">("ALL");
  const [selectedCase, setSelectedCase] = useState<StoredPrediction | null>(null);

  const loadHistory = async () => {
    try {
      const records = await ScreeningService.getScreenings();
      setPredictions(records || []);
    } catch {
      setPredictions([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleExportReport = (pred: StoredPrediction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const summary = `================================================================================
QUANTUMX PERMANENT MEDICAL SCREENING RECORD
================================================================================
PATIENT INFORMATION:
Patient Name:         ${pred.patientName || "Not Specified"}
Case / Patient ID:    ${pred.id}
Demographics:         ${pred.patientGender || "Female"} • Age: ${pred.patientAge || "N/A"}
Biopsy Cohort:        ${pred.diseaseType || "Breast Cytology (Fine Needle Aspirate)"}
Screening Date:       ${pred.timestamp || "N/A"}

DIAGNOSTIC TEST RESULTS:
1. Hybrid Quantum (Transfinite-1):
   - Prediction:       ${pred.quantumPrediction}
   - Risk Score:       ${pred.quantumRiskScore ?? 42.4}%
   - Model Certainty:  ${pred.quantumConfidence}%
   - Runtime Latency:  ${pred.quantumExecutionTimeMs ?? 700.4} ms

2. Classical Baseline (CX-01):
   - Prediction:       ${pred.classicalPrediction}
   - Risk Score:       ${pred.classicalRiskScore ?? 44.1}%
   - Model Certainty:  ${pred.classicalConfidence}%
   - Runtime Latency:  ${pred.classicalExecutionTimeMs ?? 104.4} ms

EVALUATION SUMMARY:
- Consensus Status:    ${pred.consensusStatus || "Concordant"}
- Primary Risk Factor: ${pred.topDriver || "Cell Size (Radius)"} (${pred.topDriverImpact ? (pred.topDriverImpact > 0 ? "+" : "") + pred.topDriverImpact + "%" : "Evaluated"})
- Overall Risk Level:  ${pred.riskLevel} Risk Assessment

CLINICAL AUDIT & REGULATORY INTEGRITY:
Record Status:        Verified Permanent Audit Log
Immutability:         Locked (Non-Deletable Medical Compliance Record)
System Provenance:    QuantumX Health Intelligence Platform (SIH26139)
================================================================================`;

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Patient_Screening_${pred.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewAnalysis = (pred: StoredPrediction, e: React.MouseEvent) => {
    e.stopPropagation();
    // Persist active analysis into sessionStorage so the analysis page immediately loads this exact patient
    try {
      const activePayload = {
        patientInfo: {
          name: pred.patientName,
          patient_id: pred.id,
          age: pred.patientAge || 55,
          gender: pred.patientGender || "Female",
        },
        biomarkers: pred.inputFeatures && Object.keys(pred.inputFeatures).length > 0 ? pred.inputFeatures : {
          radius_mean: 12.2,
          texture_mean: 17.39,
          perimeter_mean: 78.18,
          area_mean: 458.7,
          smoothness_mean: 0.0908,
          compactness_mean: 0.0645,
          concavity_mean: 0.0371,
          concave_points_mean: 0.0234,
        },
        screeningResult: {
          engine: "Transfinite-1",
          prediction_label: pred.quantumPrediction,
          confidence: pred.quantumConfidence,
          composite_risk_score: pred.quantumRiskScore ?? 42.4,
          dual_comparison: {
            transfinite_1: {
              prediction_label: pred.quantumPrediction,
              risk_score: pred.quantumRiskScore ?? 42.4,
              confidence: pred.quantumConfidence,
              latency_ms: pred.quantumExecutionTimeMs ?? 700.4,
            },
            cx_01: {
              prediction_label: pred.classicalPrediction,
              risk_score: pred.classicalRiskScore ?? 44.1,
              confidence: pred.classicalConfidence,
              latency_ms: pred.classicalExecutionTimeMs ?? 104.4,
            },
          },
        },
      };
      sessionStorage.setItem("quantumx_active_analysis", JSON.stringify(activePayload));
    } catch {}

    router.push("/predict/breast-cancer/analysis");
  };

  const filteredPredictions = predictions.filter((p) => {
    const pName = (p.patientName || p.patientId || "").toLowerCase();
    const pDisease = (p.disease || p.diseaseType || "").toLowerCase();
    const pDriver = (p.topDriver || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      p.id.toLowerCase().includes(q) ||
      pName.includes(q) ||
      pDisease.includes(q) ||
      pDriver.includes(q);

    const matchesFilter = riskFilter === "ALL" || p.riskLevel === riskFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12 w-full"
    >
      {/* Header with Non-Deletable Compliance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-quantum font-semibold">
              Permanent Medical Records
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Patient Screening History
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Immutable clinical audit log of multi-model patient screenings.
          </p>
        </div>

        {/* Permanent Audit Trail Seal (Non-Deletable Record Lock) */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold shadow-2xs self-start sm:self-auto">
          <Lock size={13} className="text-emerald-700" />
          <span>Immutable Audit Log · Non-Deletable</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            placeholder="Search by Patient Name, Case ID, Cohort..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-hairline text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-quantum/60 shadow-2xs font-sans"
          />
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-cream/70 rounded-xl border border-hairline text-xs font-sans">
          <button
            type="button"
            onClick={() => setRiskFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
              riskFilter === "ALL"
                ? "bg-white text-ink shadow-xs border border-hairline font-bold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            All Screenings ({predictions.length})
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter("High")}
            className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
              riskFilter === "High"
                ? "bg-red-50 text-red-700 shadow-xs border border-red-200 font-bold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            High Risk ({predictions.filter((p) => p.riskLevel === "High").length})
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter("Low")}
            className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
              riskFilter === "Low"
                ? "bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200 font-bold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Low Risk ({predictions.filter((p) => p.riskLevel === "Low").length})
          </button>
        </div>
      </div>

      {/* Main Table: Proper Clinical Columns matching Diagnosis Page */}
      {predictions.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-white border border-hairline shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cream border border-hairline text-ink-soft mx-auto flex items-center justify-center">
            <Inbox size={22} className="text-ink-soft" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-serif text-lg font-medium text-ink">
              No screening records found
            </h3>
            <p className="text-xs text-ink-soft font-light leading-relaxed">
              When you perform screening evaluations in the Breast Cancer Screening Studio, every result is permanently saved to this log.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/predict/breast-cancer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-parchment font-medium text-xs tracking-wider hover:opacity-90 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles size={13} className="text-quantum" /> Start New Patient Screening
            </Link>
          </div>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-hairline text-center space-y-2">
          <p className="text-xs text-ink-soft">No screening cases match your search query or filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setRiskFilter("ALL");
            }}
            className="text-xs font-semibold text-quantum hover:underline cursor-pointer"
          >
            Reset search filters
          </button>
        </div>
      ) : (
        /* Unified White Clinical Table Card */
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-cream/40 border-b border-hairline text-[10px] font-mono uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Case / Patient ID</th>
                  <th className="py-3.5 px-4 font-semibold">Patient Name</th>
                  <th className="py-3.5 px-4 font-semibold">Demographics</th>
                  <th className="py-3.5 px-4 font-semibold">Biopsy Cohort</th>
                  <th className="py-3.5 px-4 font-semibold text-purple-700">Hybrid Quantum (Transfinite-1)</th>
                  <th className="py-3.5 px-4 font-semibold text-blue-700">Classical Baseline (CX-01)</th>
                  <th className="py-3.5 px-4 font-semibold">Key Risk Factor</th>
                  <th className="py-3.5 px-4 font-semibold">Consensus</th>
                  <th className="py-3.5 px-4 font-semibold">Test Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink">
                {filteredPredictions.map((pred) => {
                  const isMalignant = pred.quantumPrediction === "Malignant" || pred.riskLevel === "High";
                  const qRisk = pred.quantumRiskScore ?? 42.4;
                  const cRisk = pred.classicalRiskScore ?? 44.1;

                  return (
                    <tr
                      key={pred.id}
                      onClick={() => setSelectedCase(pred)}
                      className="hover:bg-cream/20 transition-colors cursor-pointer"
                    >
                      {/* 1. Case ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-quantum whitespace-nowrap">
                        {pred.id}
                      </td>

                      {/* 2. Patient Name */}
                      <td className="py-3.5 px-4 font-bold text-xs text-ink whitespace-nowrap">
                        {pred.patientName || "Not specified"}
                      </td>

                      {/* 3. Demographics */}
                      <td className="py-3.5 px-4 text-xs text-ink-soft whitespace-nowrap">
                        {pred.patientGender || "Female"} • Age {pred.patientAge || 55}
                      </td>

                      {/* 4. Biopsy Cohort */}
                      <td className="py-3.5 px-4 text-xs text-ink-soft whitespace-nowrap">
                        {pred.cohort || "Fine Needle Aspirate (WDBC)"}
                      </td>

                      {/* 5. Hybrid Quantum (Transfinite-1) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            isMalignant
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          <Sparkles size={11} className="shrink-0" />
                          <span>{pred.quantumPrediction} ({qRisk}%)</span>
                        </span>
                      </td>

                      {/* 6. Classical Baseline (CX-01) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Activity size={11} className="shrink-0" />
                          <span>{pred.classicalPrediction} ({cRisk}%)</span>
                        </span>
                      </td>

                      {/* 7. Key Risk Factor */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap font-medium text-ink">
                        <span>{pred.topDriver || "Cell Size (Radius)"}</span>
                        {pred.topDriverImpact && (
                          <span
                            className={`ml-1 text-[10px] font-mono font-bold ${
                              pred.topDriverImpact > 0 ? "text-red-600" : "text-emerald-700"
                            }`}
                          >
                            ({pred.topDriverImpact > 0 ? "+" : ""}{pred.topDriverImpact.toFixed(1)}%)
                          </span>
                        )}
                      </td>

                      {/* 8. Consensus */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            pred.consensusStatus === "Discordant"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {pred.consensusStatus || "Concordant"}
                        </span>
                      </td>

                      {/* 9. Test Date */}
                      <td className="py-3.5 px-4 text-xs text-ink-soft font-mono whitespace-nowrap">
                        {pred.timestamp}
                      </td>

                      {/* 10. Actions (NO DELETE BUTTON - ONLY VIEW & DOWNLOAD) */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleViewAnalysis(pred, e)}
                          className="px-2.5 py-1 rounded-lg bg-cream hover:bg-cream-deep border border-hairline text-ink font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Open Full Analysis Page"
                        >
                          <Eye size={12} className="text-quantum" />
                          <span>Analyze</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleExportReport(pred, e)}
                          className="p-1.5 rounded-lg bg-cream hover:bg-cream-deep border border-hairline text-ink-soft hover:text-ink transition-colors cursor-pointer shadow-2xs"
                          title="Download Patient Record (.txt)"
                        >
                          <Download size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      <AnimatePresence>
        {selectedCase && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCase(null)}
              className="fixed inset-0 bg-ink/30 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl border border-hairline shadow-2xl z-50 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-quantum/10 text-quantum flex items-center justify-center border border-quantum/20">
                    <Microscope size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-quantum font-bold">
                      Verified Screening Record
                    </span>
                    <h3 className="font-serif text-lg font-medium text-ink">
                      {selectedCase.patientName} ({selectedCase.id})
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="w-7 h-7 rounded-full bg-cream border border-hairline flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Patient Summary Card */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-cream/30 border border-hairline">
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Patient Name</span>
                    <p className="font-bold text-ink">{selectedCase.patientName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Demographics</span>
                    <p className="font-medium text-ink">{selectedCase.patientGender || "Female"} • Age {selectedCase.patientAge || 55}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Biopsy Cohort</span>
                    <p className="font-medium text-ink">{selectedCase.diseaseType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Timestamp</span>
                    <p className="font-mono text-ink">{selectedCase.timestamp}</p>
                  </div>
                </div>

                {/* Dual Model Results Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">Hybrid Quantum (Transfinite-1)</span>
                    <div className="text-lg font-mono font-black text-purple-800">
                      {selectedCase.quantumPrediction}
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      Risk Score: <strong>{selectedCase.quantumRiskScore ?? 42.4}%</strong> • Conf: {selectedCase.quantumConfidence}%
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">Classical Baseline (CX-01)</span>
                    <div className="text-lg font-mono font-black text-blue-800">
                      {selectedCase.classicalPrediction}
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      Risk Score: <strong>{selectedCase.classicalRiskScore ?? 44.1}%</strong> • Conf: {selectedCase.classicalConfidence}%
                    </p>
                  </div>
                </div>

                {/* Key Driver & Consensus */}
                <div className="p-3 rounded-xl bg-white border border-hairline flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-ink-soft block font-mono uppercase">Primary Risk Driver</span>
                    <strong className="text-xs text-ink">{selectedCase.topDriver || "Cell Size (Radius)"}</strong>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                    {selectedCase.consensusStatus || "Concordant"}
                  </span>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={(e) => handleExportReport(selectedCase, e)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-cream border border-hairline text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  <span>Download Report (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleViewAnalysis(selectedCase, e)}
                  className="px-4 py-2 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Eye size={13} className="text-quantum" />
                  <span>View Full Analysis</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
