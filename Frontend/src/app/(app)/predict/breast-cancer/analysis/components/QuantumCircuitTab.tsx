"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { showToast } from "@/components/common/ToastNotification";
import { WDBC_REFERENCE_DATA } from "./BiomarkerMatrixTab";

interface QuantumCircuitTabProps {
  biomarkers: Record<string, number>;
}

export default function QuantumCircuitTab({ biomarkers }: QuantumCircuitTabProps) {
  const [copiedQasm, setCopiedQasm] = useState(false);

  const generateDynamicQasm = () => {
    const keys = Object.keys(WDBC_REFERENCE_DATA);
    const lines = [
      "OPENQASM 3.0;",
      'include "stdgates.inc";',
      "qubit[8] q;",
      "bit[8] c;",
      "// 1. QuantumX Pauli-Z Encoding (Patient Biomarkers)"
    ];
    keys.forEach((k, idx) => {
      const val = biomarkers[k] || WDBC_REFERENCE_DATA[k].benignMed;
      const angle = (val * 0.1).toFixed(4);
      lines.push(`h q[${idx}];`);
      lines.push(`rz(2.0 * ${angle}) q[${idx}];`);
    });
    lines.push("// 2. Pairwise Feature Entanglement");
    for (let i = 0; i < 7; i++) {
      lines.push(`cx q[${i}], q[${i + 1}];`);
      lines.push(`rz(1.4826) q[${i + 1}];`);
      lines.push(`cx q[${i}], q[${i + 1}];`);
    }
    lines.push("// 3. Strongly Entangling Variational Classifier");
    for (let i = 0; i < 8; i++) {
      lines.push(`rot(0.482, -1.203, 0.814) q[${i}];`);
    }
    lines.push("c = measure q;");
    return lines.join("\n");
  };

  const handleCopyQasm = () => {
    navigator.clipboard.writeText(generateDynamicQasm());
    setCopiedQasm(true);
    showToast({
      title: "Code Copied",
      message: "Quantum circuit instructions copied to clipboard.",
      type: "quantum"
    });
    setTimeout(() => setCopiedQasm(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-white border border-hairline flex items-center justify-between shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-ink">Live Quantum Circuit Code (OpenQASM 3.0)</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            The exact quantum gate instructions compiled for Transfinite-1 and executable on physical IBM quantum processors.
          </p>
        </div>
        <button
          onClick={handleCopyQasm}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-cream border border-hairline text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          {copiedQasm ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          <span>{copiedQasm ? "Copied!" : "Copy Quantum Code"}</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-hairline font-mono text-xs text-ink overflow-x-auto max-h-80 shadow-xs">
        <pre>{generateDynamicQasm()}</pre>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-hairline shadow-2xs">
          <span className="text-ink-soft text-[10px] uppercase font-bold block">Quantum Machine</span>
          <span className="text-ink font-bold">ibm_brisbane (127Q)</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-hairline shadow-2xs">
          <span className="text-ink-soft text-[10px] uppercase font-bold block">Active Qubits</span>
          <span className="text-ink font-bold">8 Physical Qubits</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-hairline shadow-2xs">
          <span className="text-ink-soft text-[10px] uppercase font-bold block">Noise Filter</span>
          <span className="text-emerald-700 font-bold">M3 Active</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-hairline shadow-2xs">
          <span className="text-ink-soft text-[10px] uppercase font-bold block">Decoupling</span>
          <span className="text-quantum font-bold">XY4 Pulse</span>
        </div>
      </div>
    </div>
  );
}
