"use client";

import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Sparkles } from "lucide-react";

export default function BlochSphereVisualizer() {
  const [theta, setTheta] = useState(0.85); // Angle from Z axis (0 to PI)
  const [phi, setPhi] = useState(1.1);    // Angle around Z axis (0 to 2*PI)
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setPhi((p) => (p + 0.02) % (Math.PI * 2));
    }, 30);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Spherical to 2D projection
  const r = 90; // sphere radius
  const cx = 140;
  const cy = 130;

  // Vector coordinates
  const x3d = Math.sin(theta) * Math.cos(phi);
  const y3d = Math.sin(theta) * Math.sin(phi);
  const z3d = Math.cos(theta);

  // Isometric projection
  const isoAngle = Math.PI / 6;
  const px = cx + r * (x3d * Math.cos(isoAngle) - y3d * Math.cos(isoAngle));
  const py = cy - r * z3d + r * (x3d * Math.sin(isoAngle) + y3d * Math.sin(isoAngle)) * 0.45;

  // Compute state amplitudes
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = (alpha * alpha * 100).toFixed(1);
  const prob1 = (beta * beta * 100).toFixed(1);

  return (
    <div className="flex flex-col items-center bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-indigo-500/5">
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Bloch Sphere State Vector |ψ⟩
          </span>
        </div>
        <button
          onClick={() => setIsRotating(!isRotating)}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition-colors"
        >
          {isRotating ? (
            <>
              <RotateCcw className="w-3 h-3 animate-spin" /> Rotating
            </>
          ) : (
            <>
              <Play className="w-3 h-3" /> Auto-Spin
            </>
          )}
        </button>
      </div>

      <div className="relative w-[280px] h-[260px] flex items-center justify-center">
        <svg width="280" height="260" className="overflow-visible">
          <defs>
            <radialGradient id="sphereGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(245, 243, 255, 0.9)" />
              <stop offset="70%" stopColor="rgba(238, 242, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(224, 231, 255, 0.15)" />
            </radialGradient>
            <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>

          {/* Base Sphere */}
          <circle cx={cx} cy={cy} r={r} fill="url(#sphereGrad)" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Equator Ellipse */}
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.32} fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Vertical Meridian */}
          <ellipse cx={cx} cy={cy} rx={r * 0.32} ry={r} fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />

          {/* Coordinate Axes */}
          {/* Z Axis (Vertical) */}
          <line x1={cx} y1={cy - r - 18} x2={cx} y2={cy + r + 18} stroke="#64748B" strokeWidth="1.5" />
          <text x={cx + 8} y={cy - r - 8} fill="#4F46E5" fontSize="11" fontWeight="bold">|0⟩ (Z+)</text>
          <text x={cx + 8} y={cy + r + 18} fill="#64748B" fontSize="11" fontWeight="bold">|1⟩ (Z-)</text>

          {/* X Axis */}
          <line x1={cx - r - 12} y1={cy + r * 0.25} x2={cx + r + 12} y2={cy - r * 0.25} stroke="#CBD5E1" strokeWidth="1" />
          <text x={cx + r + 14} y={cy - r * 0.25 + 4} fill="#94A3B8" fontSize="10">|+⟩ (X)</text>

          {/* Vector Shadow Projection */}
          <line x1={cx} y1={cy} x2={px} y2={cy + (py - cy) * 0.3} stroke="#C7D2FE" strokeWidth="1.5" strokeDasharray="2 2" />

          {/* State Vector |ψ⟩ */}
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="url(#vectorGrad)" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx={px} cy={py} r="6" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2.5" className="drop-shadow-md animate-pulse" />
        </svg>
      </div>

      {/* Probability Amplitude Readout */}
      <div className="w-full mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-2.5">
          <div className="text-[11px] font-medium text-slate-500">P(|0⟩ Malignant)</div>
          <div className="text-lg font-bold text-indigo-600">{prob0}%</div>
        </div>
        <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-2.5">
          <div className="text-[11px] font-medium text-slate-500">P(|1⟩ Benign)</div>
          <div className="text-lg font-bold text-violet-600">{prob1}%</div>
        </div>
      </div>

      {/* Manual Controls */}
      <div className="w-full mt-4 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span>Theta (θ) Rotation: {(theta / Math.PI).toFixed(2)}π</span>
          <input
            type="range"
            min="0"
            max={Math.PI}
            step="0.05"
            value={theta}
            onChange={(e) => {
              setTheta(parseFloat(e.target.value));
              setIsRotating(false);
            }}
            className="w-28 accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
}
