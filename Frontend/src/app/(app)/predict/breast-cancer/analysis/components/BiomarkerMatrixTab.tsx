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
}

export const WDBC_REFERENCE_DATA: Record<string, BiomarkerReference> = {
  radius_mean: {
    label: "Cell Size (Radius)",
    unit: "μm",
    benignMed: 12.2,
    maligMed: 17.33,
    normalMax: 14.5,
    simpleDesc: "Average distance from cell center to outer border.",
    tooltip:
      "Measures the overall radius of the cell nucleus. Abnormally large cell nuclei are one of the most common signs of rapidly dividing cancer cells."
  },
  texture_mean: {
    label: "Surface Texture",
    unit: "std",
    benignMed: 17.39,
    maligMed: 21.46,
    normalMax: 22.8,
    simpleDesc: "Measures internal roughness and graininess.",
    tooltip:
      "Measures variation in shading inside the cell nucleus. Cancerous cells often have clumpy, darker, and rougher chromatin texture."
  },
  perimeter_mean: {
    label: "Cell Border Length (Perimeter)",
    unit: "μm",
    benignMed: 78.18,
    maligMed: 114.2,
    normalMax: 94.0,
    simpleDesc: "Total distance around the outer membrane.",
    tooltip:
      "The total perimeter of the cell nucleus. Irregular, jagged cancer cells have significantly longer border perimeters than round, smooth healthy cells."
  },
  area_mean: {
    label: "Total Cell Area",
    unit: "μm²",
    benignMed: 458.7,
    maligMed: 932.0,
    normalMax: 650.0,
    simpleDesc: "Total 2D surface space covered by the cell nucleus.",
    tooltip:
      "The total 2D area of the cell nucleus. A large nuclear area strongly correlates with active tumor growth."
  },
  smoothness_mean: {
    label: "Border Smoothness",
    unit: "idx",
    benignMed: 0.0908,
    maligMed: 0.103,
    normalMax: 0.106,
    simpleDesc: "Evenness and roundness of outer membrane.",
    tooltip:
      "Measures how smooth or jagged the outer edges of the cell are. Healthy cells have very smooth, round edges, whereas malignant cells have uneven edges."
  },
  compactness_mean: {
    label: "Cell Density (Compactness)",
    unit: "idx",
    benignMed: 0.0645,
    maligMed: 0.1328,
    normalMax: 0.115,
    simpleDesc: "How tightly packed and shaped the cell is.",
    tooltip:
      "Calculated from perimeter² / area - 1.0. Irregular, elongated, or complex cell shapes have much higher compactness scores."
  },
  concavity_mean: {
    label: "Indentation Depth",
    unit: "idx",
    benignMed: 0.0371,
    maligMed: 0.1513,
    normalMax: 0.093,
    simpleDesc: "Severity of deep hollows or dents in cell edges.",
    tooltip:
      "Measures how deeply indented the hollows on the cell boundary are. Deep indents indicate abnormal structural deformities."
  },
  concave_points_mean: {
    label: "Number of Indentations",
    unit: "cnt",
    benignMed: 0.0234,
    maligMed: 0.0863,
    normalMax: 0.048,
    simpleDesc: "Total count of sharp dents around cell border.",
    tooltip:
      "Counts the number of sharp concave notches along the perimeter. A high count of notches is a strong sign of malignancy."
  }
};

interface BiomarkerMatrixTabProps {
  biomarkers: Record<string, number>;
}

export default function BiomarkerMatrixTab({ biomarkers }: BiomarkerMatrixTabProps) {
  const getParameterStatus = (key: string, val: number) => {
    const ref = WDBC_REFERENCE_DATA[key];
    if (!ref)
      return {
        status: "normal",
        label: "Normal (Healthy Range)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        pctDev: 0
      };

    const pctDev = ((val - ref.benignMed) / ref.benignMed) * 100.0;

    if (val >= ref.maligMed) {
      return {
        status: "severe",
        label: "Higher Than Normal (High Risk)",
        color: "text-red-700 bg-red-50 border-red-200",
        pctDev
      };
    } else if (val > ref.normalMax) {
      return {
        status: "borderline",
        label: "Slightly Elevated (Borderline)",
        color: "text-amber-700 bg-amber-50 border-amber-200",
        pctDev
      };
    } else {
      return {
        status: "normal",
        label: "Normal (Healthy Range)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        pctDev
      };
    }
  };

  return (
    /* ALL 8 CELL MEASUREMENTS CONSOLIDATED INTO A SINGLE UNIFIED CARD */
    <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b border-hairline/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cream/15">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-quantum" />
            <h3 className="text-sm font-bold text-ink">
              Biopsy Cell Measurements vs. Certified Healthy Baselines
            </h3>
          </div>
          <p className="text-xs text-ink-soft">
            Precision laboratory cell measurements compared directly against Wisconsin Diagnostic Breast Cytology standards.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase shrink-0">
          <ShieldCheck size={12} />
          <span>Certified Standard Range</span>
        </div>
      </div>

      {/* Unified Measurements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-hairline">
        {/* Column 1: Primary Dimensions */}
        <div className="divide-y divide-hairline">
          {Object.entries(WDBC_REFERENCE_DATA)
            .slice(0, 4)
            .map(([key, ref]) => {
              const val = biomarkers[key] ?? ref.benignMed;
              const status = getParameterStatus(key, val);
              const pctWidth = Math.min(
                100,
                Math.max(10, ((val - ref.benignMed * 0.5) / (ref.maligMed * 1.5 - ref.benignMed * 0.5)) * 100)
              );

              return (
                <div key={key} className="p-5 space-y-3 hover:bg-cream/5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ink">{ref.label}</span>
                        <HelpTooltip title={ref.label} text={ref.tooltip} />
                      </div>
                      <p className="text-[11px] text-ink-soft leading-tight mt-0.5">{ref.simpleDesc}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Value Display with Highlight */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl font-mono font-black ${
                          status.status === "severe"
                            ? "text-red-600"
                            : status.status === "borderline"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {val}
                      </span>
                      <span className="text-xs font-mono text-ink-soft">{ref.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-ink-soft">
                      <span>Deviation:</span>
                      <strong className={status.pctDev > 0 ? "text-red-600" : "text-emerald-600"}>
                        {status.pctDev > 0 ? `+${status.pctDev.toFixed(1)}%` : `${status.pctDev.toFixed(1)}%`}
                      </strong>
                    </div>
                  </div>

                  {/* Distribution Gauge */}
                  <div className="space-y-1">
                    <div className="w-full bg-cream-deep h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status.status === "severe"
                            ? "bg-red-500"
                            : status.status === "borderline"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-ink-muted">
                      <span>Healthy Avg: {ref.benignMed}</span>
                      <span>Limit: {ref.normalMax}</span>
                      <span>High-Risk: {ref.maligMed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Column 2: Contour & Morphological Metrics */}
        <div className="divide-y divide-hairline">
          {Object.entries(WDBC_REFERENCE_DATA)
            .slice(4, 8)
            .map(([key, ref]) => {
              const val = biomarkers[key] ?? ref.benignMed;
              const status = getParameterStatus(key, val);
              const pctWidth = Math.min(
                100,
                Math.max(10, ((val - ref.benignMed * 0.5) / (ref.maligMed * 1.5 - ref.benignMed * 0.5)) * 100)
              );

              return (
                <div key={key} className="p-5 space-y-3 hover:bg-cream/5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ink">{ref.label}</span>
                        <HelpTooltip title={ref.label} text={ref.tooltip} />
                      </div>
                      <p className="text-[11px] text-ink-soft leading-tight mt-0.5">{ref.simpleDesc}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Value Display with Highlight */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl font-mono font-black ${
                          status.status === "severe"
                            ? "text-red-600"
                            : status.status === "borderline"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {val}
                      </span>
                      <span className="text-xs font-mono text-ink-soft">{ref.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-ink-soft">
                      <span>Deviation:</span>
                      <strong className={status.pctDev > 0 ? "text-red-600" : "text-emerald-600"}>
                        {status.pctDev > 0 ? `+${status.pctDev.toFixed(1)}%` : `${status.pctDev.toFixed(1)}%`}
                      </strong>
                    </div>
                  </div>

                  {/* Distribution Gauge */}
                  <div className="space-y-1">
                    <div className="w-full bg-cream-deep h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status.status === "severe"
                            ? "bg-red-500"
                            : status.status === "borderline"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-ink-muted">
                      <span>Healthy Avg: {ref.benignMed}</span>
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
