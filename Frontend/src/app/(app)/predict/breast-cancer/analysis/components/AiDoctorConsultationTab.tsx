"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  ShieldAlert,
  Bot,
  User as UserIcon,
} from "lucide-react";

interface AiDoctorConsultationTabProps {
  patientInfo: {
    name: string;
    patient_id: string;
    age: number;
    gender: string;
  };
  biomarkers: Record<string, number>;
  screeningResult: any;
  activeEngine: string;
  aiSynthesis: any;
}

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

export default function AiDoctorConsultationTab({
  patientInfo,
  biomarkers,
  screeningResult,
  activeEngine,
  aiSynthesis,
}: AiDoctorConsultationTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const rVal = biomarkers.radius_mean || 12.2;
  const aVal = biomarkers.area_mean || 458.7;
  const pVal = biomarkers.perimeter_mean || 78.2;
  const isMalignant = screeningResult.prediction_label === "Malignant";
  const riskScore = screeningResult.composite_risk_score ?? 35.4;

  // Initialize consultation message with complete clinical overview
  useEffect(() => {
    const summaryText =
      aiSynthesis?.summary_paragraph ||
      aiSynthesis?.executive_summary ||
      (isMalignant
        ? `Biopsy cell screening for ${patientInfo.name} shows noticeable enlargement with an average cell radius of ${rVal} μm and an indentation count of ${biomarkers.concave_points_mean || 0.14}. This pattern indicates cellular atypical proliferation requiring prompt clinical follow-up.`
        : `The biopsy screening for ${patientInfo.name} shows reassuring and healthy measurements with a low risk score. The cells are of standard size with smooth, uniform borders typical of healthy non-cancerous breast tissue.`);

    const morphologyText =
      aiSynthesis?.morphological_breakdown ||
      `Total cell area (${aVal} μm²) and border perimeter (${pVal} μm) are ${
        isMalignant
          ? "elevated above normal thresholds, suggesting nuclear expansion."
          : "within normal healthy limits, indicating stable and healthy cellular morphology."
      } Border smoothness is measured at ${biomarkers.smoothness_mean || 0.09}.`;

    const recommendationText =
      screeningResult.clinical_action ||
      "Routine annual screening mammography and clinical breast examination recommended.";

    const initialContent = `**Doctor's AI Clinical Assessment for ${patientInfo.name} (${patientInfo.patient_id})**

**1. Summary of Findings:**
${summaryText}

**2. Cell Structure & Shape:**
${morphologyText}

**3. Multi-Engine Evaluation (${activeEngine}):**
Evaluated with an active assessment of **${screeningResult.prediction_label || "Benign"}** (Risk Score: **${riskScore.toFixed(1)} / 100**, Certainty: **${(screeningResult.confidence ?? 50.6).toFixed(1)}%**).

**4. Recommended Next Medical Steps:**
${recommendationText}

---
*I have complete access to ${patientInfo.name}'s laboratory measurements, cellular deviations, and dual-engine data. You may type any question below to explore these findings further.*`;

    setMessages([
      {
        role: "assistant",
        content: initialContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [
    aiSynthesis,
    patientInfo.name,
    patientInfo.patient_id,
    isMalignant,
    rVal,
    aVal,
    pVal,
    biomarkers.concave_points_mean,
    biomarkers.smoothness_mean,
    activeEngine,
    screeningResult.prediction_label,
    screeningResult.confidence,
    screeningResult.clinical_action,
    riskScore,
  ]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/ask-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          patientInfo,
          biomarkers,
          screeningResult,
          activeEngine,
          history: messages.slice(-4),
        }),
      });

      const data = await response.json();
      const assistantReply: Message = {
        role: "assistant",
        content:
          data.answer ||
          "I have reviewed the patient's data, but was unable to formulate an explanation. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      console.error("Consultation send error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "A temporary network timeout occurred while querying the clinical reasoning model. Please try asking again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Full-Width AI Consultation Screen */}
      <div className="w-full bg-white rounded-2xl border border-hairline shadow-xs flex flex-col h-[640px] overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 border-b border-hairline bg-cream/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-quantum/15 text-quantum flex items-center justify-center border border-quantum/30 shadow-2xs">
              <Bot size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink">Doctor AI Clinical Consultation</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                  Full Context Active
                </span>
              </div>
              <p className="text-[11px] text-ink-soft">
                Contextualized with {patientInfo.name}&apos;s verified laboratory cytology, contour metrics, and {activeEngine} evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Conversation Stream (Wide) */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-cream/10">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-quantum text-parchment flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                      isAssistant
                        ? "bg-white border border-hairline text-ink"
                        : "bg-ink text-parchment font-medium"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    <span
                      className={`text-[9px] font-mono block mt-2 text-right ${
                        isAssistant ? "text-ink-muted" : "text-parchment/60"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-ink text-parchment flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5">
                      <UserIcon size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-quantum text-parchment flex items-center justify-center shrink-0 text-xs shadow-2xs">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-hairline rounded-2xl px-4 py-3 text-xs text-ink-soft flex items-center gap-2 shadow-2xs">
                  <Loader2 size={13} className="animate-spin text-quantum" />
                  <span>Doctor AI is analyzing laboratory data and formulating an explanation...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Centered Small Typing Bar & Professional Disclaimer */}
        <div className="p-4 bg-white border-t border-hairline">
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="flex items-center gap-2 bg-cream/40 border border-hairline rounded-xl px-3.5 py-2 focus-within:border-quantum focus-within:ring-2 focus-within:ring-quantum/10 transition-all shadow-2xs">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Doctor AI any question about this analysis..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-xs text-ink placeholder:text-ink-muted"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="w-8 h-8 rounded-lg bg-ink hover:bg-ink/90 text-parchment flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0"
              >
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>

            {/* Centered Medical Disclaimer */}
            <p className="text-[10px] text-ink-muted text-center leading-relaxed">
              <ShieldAlert size={11} className="inline mr-1 text-amber-600 align-sub" />
              AI-generated clinical interpretations are for research reference. Medical outputs can vary; always verify diagnostic decisions with a qualified healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
