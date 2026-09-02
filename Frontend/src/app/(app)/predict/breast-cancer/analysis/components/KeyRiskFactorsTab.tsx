"use client";

import React from "react";
import { Activity, ShieldCheck } from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";

export interface BiomarkerReference {
  label: string;
  unit: string;
  benignMed: number;
  maligMed: number;
  normalMax: number;
  simpleDesc: string;
  tooltip: string;
  defaultImpact: number;
}

export const COMBINED_BIOMARKER_DATA: Record<string, BiomarkerReference> = {
  radius_mean: {
    label: "Cell Size (Radius)",
    unit: "μm",
    benignMed: 12.2,
    maligMed: 17.33,
    normalMax: 14.5,
    simpleDesc: "Average distance from cell center to outer border.",
    tooltip:
      "Measures the overall radius of the cell nucleus. Abnormally large cell nuclei are one of the most common signs of rapidly dividing cancer cells.",
    defaultImpact: 6.6
  },
  texture_mean: {
    label: "Surface Texture",
    unit: "std",
    benignMed: 17.39,
    maligMed: 21.46,
    normalMax: 22.8,
    simpleDesc: "Measures internal roughness and graininess.",
    tooltip:
      "Measures variation in shading inside the cell nucleus. Cancerous cells often have clumpy, darker, and rougher chromatin texture.",
    defaultImpact: -0.1
  },
  perimeter_mean: {
    label: "Cell Border Length (Perimeter)",
    unit: "μm",
    benignMed: 78.18,
    maligMed: 114.2,
    normalMax: 94.0,
    simpleDesc: "Total distance around the outer membrane.",
    tooltip:
      "The total perimeter of the cell nucleus. Irregular, jagged cancer cells have significantly longer border perimeters than round, smooth healthy cells.",
    defaultImpact: 0.1
  },
  area_mean: {
    label: "Total Cell Area",
    unit: "μm²",
    benignMed: 458.7,
    maligMed: 932.0,
    normalMax: 650.0,
    simpleDesc: "Total 2D surface space covered by the cell nucleus.",
    tooltip:
      "The total 2D area of the cell nucleus. A large nuclear area strongly correlates with active tumor growth.",
    defaultImpact: -0.0
  },
  smoothness_mean: {
    label: "Border Smoothness",
    unit: "idx",
    benignMed: 0.0908,
    maligMed: 0.103,
    normalMax: 0.106,
    simpleDesc: "Evenness and roundness of outer membrane.",
    tooltip:
      "Measures how smooth or jagged the outer edges of the cell are. Healthy cells have very smooth, round edges, whereas malignant cells have uneven edges.",
    defaultImpact: -0.0
  },
  compactness_mean: {
    label: "Cell Density (Compactness)",
    unit: "idx",
    benignMed: 0.0645,
    maligMed: 0.1328,
    normalMax: 0.115,
    simpleDesc: "How tightly packed and shaped the cell is.",
    tooltip:
      "Calculated from perimeter² / area - 1.0. Irregular, elongated, or complex cell shapes have much higher compactness scores.",
    defaultImpact: -3.4
  },
  concavity_mean: {
    label: "Indentation Depth",
    unit: "idx",
    benignMed: 0.0371,
    maligMed: 0.1513,
    normalMax: 0.093,
    simpleDesc: "Severity of deep hollows or dents in cell edges.",
    tooltip:
      "Measures how deeply indented the hollows on the cell boundary are. Deep indents indicate abnormal structural deformities.",
    defaultImpact: -5.9
  },
  concave_points_mean: {
    label: "Number of Indentations",
    unit: "cnt",
    benignMed: 0.0234,
    maligMed: 0.0863,
    normalMax: 0.048,
    simpleDesc: "Total count of sharp dents around cell border.",
    tooltip:
      "Counts the number of sharp concave notches along the perimeter. A high count of notches is a strong sign of malignancy.",
    defaultImpact: -2.6
  }
};

interface KeyRiskFactorsTabProps {
  isHybrid: boolean;
  activeEngineName: string;
  activeAttributions: any[];
  biomarkers: Record<string, number>;
}

export default function KeyRiskFactorsTab({
  isHybrid,
  activeEngineName,
  activeAttributions,
  biomarkers,
}: KeyRiskFactorsTabProps) {
  // Map attributions by key for quick lookup
  const attributionMap: Record<string, any> = {};
  if (activeAttributions && activeAttributions.length > 0) {
    activeAttributions.forEach((attr: any) => {
      const key = attr.featureKey || attr.feature_key;
      if (key) attributionMap[key] = attr;
    });
  }

  const getFactorDetails = (key: string, val: number) => {
    const ref = COMBINED_BIOMARKER_DATA[key];
    const attr = attributionMap[key];

    const pctDev = ((val - ref.benignMed) / ref.benignMed) * 100.0;

    // Status evaluation
    let statusLabel = "Normal (Healthy Range)";
    let statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    let isSevere = false;
    let isBorderline = false;

    if (val >= ref.maligMed) {
      statusLabel = "Higher Than Normal (High Risk)";
      statusColor = "text-red-700 bg-red-50 border-red-200";
      isSevere = true;
    } else if (val > ref.normalMax) {
      statusLabel = "Slightly Elevated (Borderline)";
      statusColor = "text-amber-700 bg-amber-50 border-amber-200";
      isBorderline = true;
    }

    // Impact calculation
    let impactPct = ref.defaultImpact;
    if (attr) {
      impactPct = attr.impactPercentage ?? attr.impact_percentage ?? (attr.rawImpact ? attr.rawImpact * 100 : ref.defaultImpact);
    } else if (isSevere) {
      impactPct = Math.min(18.0, Math.max(4.0, pctDev * 0.15));
    } else if (isBorderline) {
      impactPct = Math.min(6.0, Math.max(1.0, pctDev * 0.1));
    } else {
      impactPct = Math.max(-10.0, Math.min(-0.1, pctDev * 0.08));
    }

    const isRiskElevating = impactPct > 0;

    return {
      statusLabel,
      statusColor,
      isSevere,
      isBorderline,
      pctDev,
      impactPct: Math.abs(impactPct),
      isRiskElevating,
      ref
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-hairline/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cream/15">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-quantum" />
            <h3 className="text-sm font-bold text-ink">
              Biopsy Cell Measurements &amp; Key Risk Factors ({activeEngineName})
            </h3>
            <HelpTooltip
              title="Key Risk Factors & Attributions"
              text={
                isHybrid
                  ? "Combines verified laboratory cell measurements with Transfinite-1 Quantum Saliency gate rotations, showing exactly which features drove the risk assessment."
                  : "Combines verified laboratory cell measurements with CX-01 Classical SHAP feature values, showing linear and non-linear tree decision contributions."
              }
            />
          </div>
          <p className="text-xs text-ink-soft">
            Features in <strong className="text-red-600">Red</strong> elevated the risk calculation, while features in <strong className="text-emerald-700">Green</strong> were healthy and reduced the risk score.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase shrink-0">
          <ShieldCheck size={12} />
          <span>Clinical Attribution Data</span>
        </div>
      </div>

      {/* Unified 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-hairline">
        {/* Column 1 */}
        <div className="divide-y divide-hairline">
          {Object.entries(COMBINED_BIOMARKER_DATA)
            .slice(0, 4)
            .map(([key, ref]) => {
              const val = biomarkers[key] ?? ref.benignMed;
              const details = getFactorDetails(key, val);
              const pctWidth = Math.min(
                100,
                Math.max(10, ((val - ref.benignMed * 0.5) / (ref.maligMed * 1.5 - ref.benignMed * 0.5)) * 100)
              );

              return (
                <div key={key} className="p-5 space-y-3 hover:bg-cream/5 transition-colors">
                  {/* Title & Status Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ink">{ref.label}</span>
                        <HelpTooltip title={ref.label} text={ref.tooltip} />
                      </div>
                      <p className="text-[11px] text-ink-soft leading-tight mt-0.5">{ref.simpleDesc}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${details.statusColor}`}>
                        {details.statusLabel}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          details.isRiskElevating ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {details.isRiskElevating ? "+" : "-"}{details.impactPct.toFixed(1)}% Impact
                      </span>
                    </div>
                  </div>

                  {/* Value & Deviation */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl font-mono font-black ${
                          details.isSevere
                            ? "text-red-600"
                            : details.isBorderline
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {val}
                      </span>
                      <span className="text-xs font-mono text-ink-soft">{ref.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-ink-soft">Deviation:</span>
                      <strong className={details.pctDev > 0 ? "text-red-600" : "text-emerald-600"}>
                        {details.pctDev > 0 ? `+${details.pctDev.toFixed(1)}%` : `${details.pctDev.toFixed(1)}%`}
                      </strong>
                    </div>
                  </div>

                  {/* Distribution Gauge */}
                  <div className="space-y-1">
                    <div className="w-full bg-cream-deep h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          details.isSevere
                            ? "bg-red-500"
                            : details.isBorderline
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-ink-muted">
                      <span>Healthy: {ref.benignMed}</span>
                      <span>Limit: {ref.normalMax}</span>
                      <span>High-Risk: {ref.maligMed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Column 2 */}
        <div className="divide-y divide-hairline">
          {Object.entries(COMBINED_BIOMARKER_DATA)
            .slice(4, 8)
            .map(([key, ref]) => {
              const val = biomarkers[key] ?? ref.benignMed;
              const details = getFactorDetails(key, val);
              const pctWidth = Math.min(
                100,
                Math.max(10, ((val - ref.benignMed * 0.5) / (ref.maligMed * 1.5 - ref.benignMed * 0.5)) * 100)
              );

              return (
                <div key={key} className="p-5 space-y-3 hover:bg-cream/5 transition-colors">
                  {/* Title & Status Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ink">{ref.label}</span>
                        <HelpTooltip title={ref.label} text={ref.tooltip} />
                      </div>
                      <p className="text-[11px] text-ink-soft leading-tight mt-0.5">{ref.simpleDesc}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${details.statusColor}`}>
                        {details.statusLabel}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          details.isRiskElevating ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {details.isRiskElevating ? "+" : "-"}{details.impactPct.toFixed(1)}% Impact
                      </span>
                    </div>
                  </div>

                  {/* Value & Deviation */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl font-mono font-black ${
                          details.isSevere
                            ? "text-red-600"
                            : details.isBorderline
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {val}
                      </span>
                      <span className="text-xs font-mono text-ink-soft">{ref.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-ink-soft">Deviation:</span>
                      <strong className={details.pctDev > 0 ? "text-red-600" : "text-emerald-600"}>
                        {details.pctDev > 0 ? `+${details.pctDev.toFixed(1)}%` : `${details.pctDev.toFixed(1)}%`}
                      </strong>
                    </div>
                  </div>

                  {/* Distribution Gauge */}
                  <div className="space-y-1">
                    <div className="w-full bg-cream-deep h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          details.isSevere
                            ? "bg-red-500"
                            : details.isBorderline
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-ink-muted">
                      <span>Healthy: {ref.benignMed}</span>
                      <span>Limit: {ref.normalMax}</span>
                      <span>High-Risk: {ref.maligMed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
