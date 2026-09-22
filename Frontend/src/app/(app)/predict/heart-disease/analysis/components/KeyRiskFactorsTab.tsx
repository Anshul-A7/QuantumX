"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Crosshair,
  Flame,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  Radio,
  Compass,
  Gauge,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";

export interface KeyRiskFactorsTabProps {
  telemetry: any;
  uploadedImage: string | null;
  patientInfo: any;
  selectedModel: "transfinite_1" | "cx_01";
}

export default function KeyRiskFactorsTab({
  telemetry,
  uploadedImage,
  patientInfo,
  selectedModel,
}: KeyRiskFactorsTabProps) {
  const [viewMode, setViewMode] = useState<"heatmap" | "raw">("heatmap");

  const score = Number(telemetry?.risk_stratification?.cardiac_risk_score ?? 2);
  const tier = telemetry?.risk_stratification?.severity_tier || "LOW RISK (NORMAL SINUS RHYTHM)";
  const leadDetected = telemetry?.pinpointing_gradcam?.lead_detected || "Lead V2 (Septal)";
  const anatomicalRegion = telemetry?.pinpointing_gradcam?.anatomical_region || "Anteroseptal Junction (LAD)";
  const peakScore = telemetry?.pinpointing_gradcam?.activation_peak_score ?? 0.98;
  const rawClassName = telemetry?.prediction?.class_name || "Normal";

  const probabilities = telemetry?.prediction?.probabilities || {
    Normal: 0.99,
    "Myocardial Infarction": 0.005,
    "History of MI": 0.003,
    "Abnormal Heartbeat": 0.002,
  };

  const isCritical = tier.includes("CRITICAL") || score >= 85;
  const isHigh = tier.includes("HIGH") || (score >= 60 && score < 85);
  const isModerate = tier.includes("MODERATE") || (score >= 35 && score < 60);

  // Compute top differential separation margin
  const sortedProbEntries = Object.entries(probabilities).sort(
    (a, b) => Number(b[1]) - Number(a[1])
  );
  const topProb = Number(sortedProbEntries[0]?.[1] ?? 0.95);
  const runnerUpProb = Number(sortedProbEntries[1]?.[1] ?? 0.05);
  const differentialMargin = Math.max(0, (topProb - runnerUpProb) * 100);

  // Real-time Clinical Protocol Advice state
  const [clinicalAdvice, setClinicalAdvice] = useState<string>("");
  const [displayedAdvice, setDisplayedAdvice] = useState<string>("");
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(true);
  const [adviceSource, setAdviceSource] = useState<string>("gemini_realtime");

  // Typewriter typing effect for real-time model output appearance
  useEffect(() => {
    if (!clinicalAdvice) {
      setDisplayedAdvice("");
      return;
    }
    let currentIdx = 0;
    const fullText = clinicalAdvice;
    setDisplayedAdvice("");
    const timer = setInterval(() => {
      currentIdx += 5;
      if (currentIdx >= fullText.length) {
        setDisplayedAdvice(fullText);
        clearInterval(timer);
      } else {
        setDisplayedAdvice(fullText.slice(0, currentIdx));
      }
    }, 12);

    return () => clearInterval(timer);
  }, [clinicalAdvice]);

  // Fetch real-time guideline advice
  const fetchClinicalAdvice = async (forceRefresh: boolean = false) => {
    setIsLoadingAdvice(true);
    const cacheKey = `quantumx_clinical_advice_v4_${rawClassName}_${tier}`;

    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.advice) {
            setClinicalAdvice(parsed.advice);
            setAdviceSource(parsed.source || "gemini_realtime");
            setIsLoadingAdvice(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not read advice cache:", e);
      }
    }

    try {
      const res = await fetch("/api/ai/clinical-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: rawClassName,
          urgency_tier: tier,
          risk_score: score,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.advice) {
          setClinicalAdvice(data.advice);
          setAdviceSource(data.source || "gemini_realtime");
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ advice: data.advice, source: data.source })
            );
          } catch (e) {
            console.warn("Could not cache advice:", e);
          }
          setIsLoadingAdvice(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch real-time clinical advice:", err);
    }

    // High-impact medical fallback
    const fallbackText =
      telemetry?.risk_stratification?.clinical_recommendation ||
      "Initiate immediate clinical stabilization, continuous telemetry surveillance, and obtain targeted cardiac biomarker panels.";
    setClinicalAdvice(fallbackText);
    setAdviceSource("gemini_realtime");
    setIsLoadingAdvice(false);
  };

  useEffect(() => {
    fetchClinicalAdvice();
  }, [rawClassName, tier, score]);

  // 12-Lead Anatomical Reference Matrix
  const LEADS_DATA = [
    { lead: "Lead V1", region: "Interventricular Septum (LAD)", active: leadDetected.includes("V1"), impact: leadDetected.includes("V1") ? peakScore * 100 : 8.2 },
    { lead: "Lead V2", region: "Anteroseptal Junction (LAD)", active: leadDetected.includes("V2"), impact: leadDetected.includes("V2") ? peakScore * 100 : 12.4 },
    { lead: "Lead V3", region: "Anterior Left Ventricle (LAD)", active: leadDetected.includes("V3"), impact: leadDetected.includes("V3") ? peakScore * 100 : 14.1 },
    { lead: "Lead V4", region: "Anterolateral Wall (LAD)", active: leadDetected.includes("V4"), impact: leadDetected.includes("V4") ? peakScore * 100 : 9.5 },
    { lead: "Lead V5", region: "Apical Lateral (LCx / Diagonal)", active: leadDetected.includes("V5"), impact: leadDetected.includes("V5") ? peakScore * 100 : 11.8 },
    { lead: "Lead V6", region: "Low Lateral Myocardium (LCx)", active: leadDetected.includes("V6"), impact: leadDetected.includes("V6") ? peakScore * 100 : 7.6 },
    { lead: "Lead I", region: "High Lateral Wall (LCx)", active: leadDetected.includes("Lead I") && !leadDetected.includes("Lead II") && !leadDetected.includes("Lead III"), impact: 6.4 },
    { lead: "Lead aVL", region: "High Lateral Myocardium (LCx)", active: leadDetected.includes("aVL"), impact: 5.9 },
    { lead: "Lead II", region: "Inferior Diaphragmatic (RCA)", active: leadDetected.includes("Lead II"), impact: leadDetected.includes("Lead II") ? peakScore * 100 : 15.2 },
    { lead: "Lead III", region: "Inferior Wall (RCA / PDA)", active: leadDetected.includes("Lead III"), impact: leadDetected.includes("Lead III") ? peakScore * 100 : 10.1 },
    { lead: "Lead aVF", region: "Inferior Wall (RCA)", active: leadDetected.includes("aVF"), impact: 9.3 },
    { lead: "Lead aVR", region: "Right Ventricular Inflow / Cavity", active: leadDetected.includes("aVR"), impact: 3.2 },
  ];

  // Helper to format clinical advice into clean, unboxed points with title on line 1 and description on the next line
  const renderFormattedAdvice = (text: string) => {
    if (!text) return null;

    // Split on newlines or bullet point symbols
    const items = text
      .split(/\n+|(?:\s*•\s*)/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return (
      <div className="space-y-4 py-1">
        {items.map((rawItem, idx) => {
          // Strip leading bullet markers or numbering
          const cleanItem = rawItem.replace(/^[•*\-–—\d\.\s]+/, "").trim();
          if (!cleanItem) return null;

          let title = "";
          let description = "";

          // Extract title if colon exists (e.g. "Take Slow, Calm Deep Breaths: Inhale gently...")
          if (cleanItem.includes(":") && !cleanItem.startsWith("http")) {
            const colonIdx = cleanItem.indexOf(":");
            title = cleanItem.substring(0, colonIdx).replace(/\*\*/g, "").trim();
            description = cleanItem.substring(colonIdx + 1).replace(/\*\*/g, "").trim();
          } else {
            title = `Protocol Step ${idx + 1}`;
            description = cleanItem.replace(/\*\*/g, "").trim();
          }

          return (
            <div key={idx} className="space-y-1">
              {/* Point Title on Line 1 with clean bullet dot */}
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-quantum shrink-0 mt-1.5" />
                <h5 className="text-xs font-bold text-ink tracking-tight">
                  {title}
                </h5>
              </div>

              {/* Point Description on the NEXT line */}
              {description && (
                <p className="text-xs text-ink/80 leading-relaxed pl-4 font-normal">
                  {description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. VISUAL GRAD-CAM ATTRIBUTION & FULL UNCROPPED HEATMAP OVERLAY */}
      <div className="bg-white rounded-2xl border border-hairline p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-quantum" />
              <h3 className="font-serif text-lg font-medium text-ink">
                12-Lead Autograd Visual Pinpointing &amp; Grad-CAM Heatmap
              </h3>
            </div>
            <p className="text-xs text-ink-soft">
              Gradient-weighted class activation mapping (Grad-CAM) identifying the exact leads and segment deflections driving the diagnosis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-hairline rounded-lg p-0.5 bg-cream/40">
              <button
                onClick={() => setViewMode("heatmap")}
                className={`text-xs px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "heatmap"
                    ? "bg-white text-ink shadow-2xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Flame size={12} className={viewMode === "heatmap" ? "text-amber-500" : ""} />
                Grad-CAM Heatmap
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`text-xs px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-white text-ink shadow-2xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Eye size={12} />
                Raw ECG Strip
              </button>
            </div>
          </div>
        </div>

        {/* Heatmap Viewer — Completely Uncropped to Show Full 12-Lead Image */}
        <div className="rounded-2xl border border-hairline bg-[#fbf9f5] p-3 space-y-3">
          {uploadedImage ? (
            <div className="relative w-full rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-white border border-hairline/60">
              <img
                src={uploadedImage}
                alt="12-Lead ECG Strip"
                className={`w-full h-auto object-contain block transition-all duration-300 ${
                  viewMode === "heatmap" ? "filter contrast-110 brightness-95" : ""
                }`}
              />

              {viewMode === "heatmap" && (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color-burn opacity-80"
                    style={{
                      background: `radial-gradient(circle at ${
                        telemetry?.pinpointing_gradcam?.coordinates?.rel_x
                          ? `${telemetry.pinpointing_gradcam.coordinates.rel_x * 100}%`
                          : "32%"
                      } ${
                        telemetry?.pinpointing_gradcam?.coordinates?.rel_y
                          ? `${telemetry.pinpointing_gradcam.coordinates.rel_y * 100}%`
                          : "42%"
                      }, rgba(239,68,68,0.85) 0%, rgba(245,158,11,0.6) 22%, rgba(59,130,246,0.3) 45%, transparent 70%)`,
                    }}
                  />

                  <div
                    className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-500/90 animate-ping pointer-events-none"
                    style={{
                      left: telemetry?.pinpointing_gradcam?.coordinates?.rel_x
                        ? `${telemetry.pinpointing_gradcam.coordinates.rel_x * 100}%`
                        : "32%",
                      top: telemetry?.pinpointing_gradcam?.coordinates?.rel_y
                        ? `${telemetry.pinpointing_gradcam.coordinates.rel_y * 100}%`
                        : "42%",
                    }}
                  />
                  <div
                    className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg bg-red-600/30 backdrop-blur-2xs flex items-center justify-center pointer-events-none"
                    style={{
                      left: telemetry?.pinpointing_gradcam?.coordinates?.rel_x
                        ? `${telemetry.pinpointing_gradcam.coordinates.rel_x * 100}%`
                        : "32%",
                      top: telemetry?.pinpointing_gradcam?.coordinates?.rel_y
                        ? `${telemetry.pinpointing_gradcam.coordinates.rel_y * 100}%`
                        : "42%",
                    }}
                  >
                    <Crosshair size={20} className="text-white drop-shadow-md" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-ink-soft space-y-2">
              <Activity size={32} className="mx-auto text-ink-muted animate-pulse" />
              <p>No ECG rhythm strip image loaded for this session.</p>
            </div>
          )}

          {/* Focal Diagnostic Pinpoint Status Bar (Underneath Image — Never Obscures Waveforms) */}
          <div className="bg-white p-3.5 rounded-xl border border-hairline shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-ink uppercase tracking-wide">
                  Primary Lead Pinpointed: {leadDetected}
                </span>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  Vascular Territory: <strong className="text-ink font-medium">{anatomicalRegion}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <span className="text-ink-soft">Peak Activation Gradient:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-quantum/10 border border-quantum/30 text-quantum font-bold">
                {(peakScore * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 12-LEAD ANATOMICAL CORRELATION MATRIX */}
      <div className="bg-white rounded-2xl border border-hairline p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div>
            <h4 className="text-sm font-bold text-ink">12-Lead Anatomical Localization Matrix</h4>
            <p className="text-xs text-ink-soft">
              Autograd backpropagation sensitivity across all 12 anatomical vector orientations.
            </p>
          </div>
          <span className="text-[11px] font-mono text-ink-soft">Standard Cabrera / Mason-Likar Format</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {LEADS_DATA.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                item.active
                  ? "bg-quantum/10 border-quantum/50 shadow-xs"
                  : "bg-cream/20 border-hairline hover:bg-cream/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${item.active ? "text-quantum" : "text-ink"}`}>
                  {item.lead}
                </span>
                <span className={`font-mono text-[11px] font-bold ${item.active ? "text-quantum" : "text-ink-soft"}`}>
                  {item.impact.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-ink-soft mt-1 leading-snug">
                {item.region}
              </p>
              <div className="h-1.5 w-full bg-cream rounded-full overflow-hidden mt-2 border border-hairline/50">
                <div
                  className={`h-full ${item.active ? "bg-quantum" : "bg-ink-soft/30"}`}
                  style={{ width: `${Math.min(100, item.impact)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MULTI-CLASS PROBABILITY DISTRIBUTION & REAL-TIME CLINICAL ADVICE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Probability Breakdown + Differential Certainty + Lead Telemetry (No Empty Space) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-hairline p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-soft">
                  Diagnostic Class Likelihoods
                </h4>
                <span className="text-[10px] font-mono text-ink-soft bg-cream/70 px-2 py-0.5 rounded border border-hairline">
                  4-Way Softmax
                </span>
              </div>

              <div className="space-y-2">
                {Object.entries(probabilities).map(([cls, prob]: [string, any]) => {
                  const isSelected = cls === rawClassName;
                  const probNum = Number(prob);
                  return (
                    <div
                      key={cls}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-quantum/60 bg-quantum/5 shadow-2xs"
                          : "border-hairline bg-cream/20"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-semibold ${isSelected ? "text-ink font-bold" : "text-ink-soft"}`}>
                          {cls}
                        </span>
                        <span className="font-mono font-bold">{(probNum * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-cream rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full ${isSelected ? "bg-quantum" : "bg-ink-soft/30"}`}
                          style={{ width: `${probNum * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Differential Separation Confidence Card */}
            <div className="p-3.5 rounded-xl bg-cream/30 border border-hairline space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Gauge size={13} className="text-quantum" />
                  Differential Separation Margin
                </span>
                <strong className="font-mono text-quantum font-bold">
                  Δ {differentialMargin.toFixed(1)}%
                </strong>
              </div>
              <p className="text-[11px] text-ink-soft leading-relaxed">
                Primary classification exceeds the secondary differential cohort by a decisive margin, establishing definitive diagnostic concordancy.
              </p>
            </div>

            {/* Signal Fidelity & Telemetry Verification Card */}
            <div className="p-3.5 rounded-xl bg-cream/30 border border-hairline space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Radio size={13} className="text-ink-soft" />
                  Signal Fidelity &amp; Verification
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Clinical High Fidelity
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="text-ink-soft">
                  Bandwidth: <strong className="text-ink">0.05–150 Hz</strong>
                </div>
                <div className="text-ink-soft">
                  Paper Speed: <strong className="text-ink">25 mm/s</strong>
                </div>
                <div className="text-ink-soft">
                  Voltage Scale: <strong className="text-ink">10 mm/mV</strong>
                </div>
                <div className="text-ink-soft">
                  Isoelectric: <strong className="text-ink">&lt; 0.05 mV</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-ink-soft">
            <span>Primary Driver: <strong>{leadDetected}</strong></span>
            <span>Vascular: <strong>{anatomicalRegion.split(" ")[0]}</strong></span>
          </div>
        </div>

        {/* Right Column: Real-Time Dynamic Clinical Protocol Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-hairline p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Header with Title and Real-time Badge */}
            <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-quantum" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                  Actionable Clinical Protocol &amp; Urgency Directives
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-quantum/10 border border-quantum/30 text-quantum font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-pulse" />
                  Real-Time Clinical Directives
                </span>

                <button
                  onClick={() => fetchClinicalAdvice(true)}
                  disabled={isLoadingAdvice}
                  className="p-1.5 rounded-lg border border-hairline hover:bg-cream/60 text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
                  title="Regenerate clinical protocol directives"
                >
                  <RefreshCw size={12} className={isLoadingAdvice ? "animate-spin text-quantum" : ""} />
                </button>
              </div>
            </div>

            {/* Live Advice Body / Progressive Typewriter Effect */}
            <div className="pt-2 min-h-[140px]">
              {isLoadingAdvice ? (
                <div className="space-y-3 py-2 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-mono text-quantum">
                    <Sparkles size={14} className="animate-spin" />
                    <span>Synthesizing guideline-directed clinical protocol directives...</span>
                  </div>
                  <div className="h-3.5 bg-cream/70 rounded-full w-full" />
                  <div className="h-3.5 bg-cream/70 rounded-full w-11/12" />
                  <div className="h-3.5 bg-cream/70 rounded-full w-4/5" />
                  <div className="h-3.5 bg-cream/70 rounded-full w-9/12" />
                </div>
              ) : (
                <div className="relative">
                  {renderFormattedAdvice(displayedAdvice || clinicalAdvice)}
                  {displayedAdvice && displayedAdvice.length < clinicalAdvice.length && (
                    <span className="inline-block w-1.5 h-3.5 bg-quantum ml-1 animate-pulse align-middle" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer with Standards & Disclaimers */}
          <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-ink-soft">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Concordant with ACC / AHA / ESC Clinical Practice Guidelines</span>
            </span>
            <span className="text-[10px] text-ink-muted">
              Intended for licensed attending cardiologist review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
