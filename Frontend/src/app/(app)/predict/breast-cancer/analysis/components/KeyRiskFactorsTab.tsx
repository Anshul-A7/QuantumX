"use client";

import React from "react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { WDBC_REFERENCE_DATA } from "./BiomarkerMatrixTab";

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
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-white border border-hairline shadow-2xs">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-ink">
            What Factors Influenced {activeEngineName}&apos;s Result Most?
          </h3>
          <HelpTooltip
            title="Key Risk Factors"
            text={
              isHybrid
                ? "Quantum Saliency reflects how much each qubit phase rotation in the 8-qubit variational circuit impacted the expectation value."
                : "Classical SHAP values reflect the additive contribution of each linear and tree split to the SVM-RBF and XGBoost ensemble output."
            }
          />
        </div>
        <p className="text-xs text-ink-soft mt-0.5">
          Features in <strong className="text-red-600">Red</strong> increased the risk calculation, while features in <strong className="text-emerald-700">Green</strong> were healthy and decreased the overall score.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(activeAttributions || []).map((attr: any, idx: number) => {
          const isRisk =
            attr.direction === "risk_elevating" ||
            (attr.rawImpact && attr.rawImpact > 0) ||
            (attr.impact_percentage && attr.impact_percentage > 0);
          const impactVal = Math.abs(attr.impactPercentage ?? attr.impact_percentage ?? 10);
          const name =
            attr.featureName ||
            attr.feature_name ||
            WDBC_REFERENCE_DATA[attr.featureKey || attr.feature_key]?.label ||
            "Biomarker Factor";
          const measured =
            attr.measuredValue ??
            attr.measured_value ??
            biomarkers[attr.featureKey || attr.feature_key] ??
            12.2;

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${
                isRisk ? "bg-red-50/40 border-red-200" : "bg-emerald-50/40 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-ink">{name}</span>
                <span className={`font-mono font-bold ${isRisk ? "text-red-600" : "text-emerald-700"}`}>
                  {isRisk ? "+" : "-"}{impactVal.toFixed(1)}% Impact
                </span>
              </div>
              <div className="w-full bg-cream-deep h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${isRisk ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, Math.max(8, impactVal))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-ink-soft">
                <span>
                  Measured Value: <strong className="text-ink">{measured}</strong>
                </span>
                <span className={isRisk ? "text-red-600 font-semibold" : "text-emerald-700 font-semibold"}>
                  {isRisk ? "Elevates Risk Assessment" : "Protective / Normal"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
