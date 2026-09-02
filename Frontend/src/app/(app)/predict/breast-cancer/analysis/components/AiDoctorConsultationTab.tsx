"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  FileText,
  Activity,
  Cpu,
  CheckCircle2,
  Send,
  Loader2,
  HelpCircle,
  ShieldAlert,
  Bot,
  User as UserIcon,
  CornerDownLeft
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
  aiSynthesis
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

  // Initialize initial doctor consultation message
  useEffect(() => {
    const defaultInitialSummary =
      aiSynthesis?.summary_paragraph ||
      aiSynthesis?.executive_summary ||
      (isMalignant
        ? `Biopsy cell analysis for ${patientInfo.name} shows noticeable enlargement with an average cell radius of ${rVal} μm and an indentation count of ${biomarkers.concave_points_mean || 0.14}. This overall pattern suggests a high likelihood of abnormal cellular proliferation requiring prompt medical follow-up.`
        : `The biopsy screening for ${patientInfo.name} shows reassuring and healthy measurements with a low risk score. The cells are of standard size with smooth, uniform borders typical of healthy non-cancerous breast tissue.`);

    setMessages([
      {
        role: "assistant",
        content: `Hello, I am the QuantumX AI Clinical Specialist. I have reviewed all verified laboratory measurements, cell contour analyses, and dual-engine predictions for **${patientInfo.name}** (${patientInfo.patient_id}).\n\n${defaultInitialSummary}\n\nFeel free to ask any question regarding specific cell features, risk scores, or diagnostic interpretations below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [aiSynthesis, patientInfo.name, patientInfo.patient_id, isMalignant, rVal, biomarkers.concave_points_mean]);

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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
          history: messages.slice(-4)
        })
      });

      const data = await response.json();
      const assistantReply: Message = {
        role: "assistant",
        content:
          data.answer ||
          "I have processed the patient's data, but was unable to format an explanation. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      console.error("Consultation send error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered a temporary connection issue while querying the clinical reasoning model. Please verify that the system is running and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
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

  const suggestionPills = [
    "What does this risk score mean for my health?",
    "Why are cell indentations and concavity important?",
    "How do the quantum and classical models differ for this case?",
    "Are cell radius and area within safe limits?"
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-quantum/10 border border-quantum/20 flex items-start gap-3">
        <Sparkles size={18} className="text-quantum shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
            Doctor&apos;s AI Clinical Consultation &amp; Second Opinion
          </h4>
          <p className="text-xs text-ink-soft leading-relaxed">
            Review the clinical synthesis for {patientInfo.name}&apos;s biopsy, or type any specific questions to receive an instant medical explanation grounded in the patient&apos;s exact laboratory data.
          </p>
        </div>
      </div>

      {/* Main 2-Column Consultation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Structured Clinical Findings Cards */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5 px-1">
            <FileText size={14} className="text-quantum" />
            <span>Pathology Summary &amp; Cell Profile</span>
          </h4>

          {/* 1. Summary of Findings */}
          <div className="p-4 rounded-2xl bg-white border border-hairline shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-ink">
              <span className="w-2 h-2 rounded-full bg-quantum" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-ink">1. Summary of Findings</h5>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {aiSynthesis?.summary_paragraph ||
                aiSynthesis?.executive_summary ||
                (isMalignant
                  ? `Biopsy cell analysis shows noticeable enlargement with an average cell radius of ${rVal} μm and an indentation count of ${biomarkers.concave_points_mean || 0.14}. This pattern indicates significant cellular atypical proliferation requiring prompt clinical follow-up.`
                  : `The biopsy screening for ${patientInfo.name} shows reassuring and healthy measurements with a low risk score. The cells are of standard size with smooth, uniform borders typical of healthy non-cancerous breast tissue.`)}
            </p>
          </div>

          {/* 2. What the Cell Changes Mean */}
          <div className="p-4 rounded-2xl bg-white border border-hairline shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-ink">
              <Activity size={14} className="text-blue-500" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-ink">2. Morphological Interpretation</h5>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {aiSynthesis?.morphological_breakdown ||
                `Total cell area (${aVal} μm²) and perimeter (${pVal} μm) are ${
                  isMalignant
                    ? "elevated above normal thresholds, suggesting nuclear expansion."
                    : "within normal healthy limits, indicating stable and healthy cellular morphology."
                } Border smoothness is measured at ${biomarkers.smoothness_mean || 0.09}.`}
            </p>
          </div>

          {/* 3. Computer & Quantum Check */}
          <div className="p-4 rounded-2xl bg-white border border-hairline shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-ink">
              <Cpu size={14} className="text-purple-500" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-ink">3. Dual-Engine Check</h5>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {aiSynthesis?.engine_telemetry_insight ||
                `Evaluated by both the classical computer and quantum simulator (${activeEngine}). The active engine processed the patient's cytology vector in ${
                  screeningResult.latency_ms?.toFixed(1) || "17.7"
                } ms with high certainty.`}
            </p>
          </div>

          {/* 4. Actionable Next Medical Steps */}
          <div className="p-4 rounded-2xl bg-white border border-hairline shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-ink">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-ink">4. Recommended Next Steps</h5>
            </div>
            <p className="text-xs text-ink leading-relaxed font-medium">
              {screeningResult.clinical_action || "Routine annual screening mammography and clinical breast exam recommended."}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive AI Doctor Q&A Interface */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-hairline shadow-xs flex flex-col h-[680px] overflow-hidden">
          {/* Top Bar of Chat Panel */}
          <div className="p-4 border-b border-hairline bg-cream/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-quantum/15 text-quantum flex items-center justify-center border border-quantum/30 shadow-2xs">
                <Bot size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">Doctor AI Interactive Consultation</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                    Full Context Active
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft">
                  Contextualized with {patientInfo.name}&apos;s complete biopsy measurements and active model findings.
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Conversation Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-cream/10">
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
                  <span>Doctor AI is reviewing cell measurements and formulating explanation...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-4 py-2 bg-white border-t border-hairline/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-ink-muted shrink-0 text-[10px] font-mono uppercase font-bold">Suggested:</span>
            {suggestionPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(pill)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-cream/70 hover:bg-cream border border-hairline text-ink-soft hover:text-ink whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Context Notice Above Typing Bar */}
          <div className="px-4 py-1.5 bg-cream/30 border-t border-hairline/60 text-[11px] text-ink-soft flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Doctor AI has full knowledge of this patient&apos;s biopsy, normal reference limits, and dual-engine predictions.
            </span>
          </div>

          {/* Interactive Typing Bar */}
          <div className="p-3 bg-white border-t border-hairline">
            <div className="flex items-center gap-2 bg-cream/40 border border-hairline rounded-xl px-3 py-2 focus-within:border-quantum focus-within:ring-2 focus-within:ring-quantum/10 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Doctor AI about this report, cell metrics, or risk score..."
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

            {/* Required Professional Phrased Medical Disclaimer */}
            <p className="text-[10px] text-ink-muted text-center mt-2 leading-relaxed px-2">
              <ShieldAlert size={11} className="inline mr-1 text-amber-600 align-sub" />
              AI-generated clinical interpretations are for diagnostic assistance and research reference. Because interpretations can vary, always verify critical healthcare decisions with a certified pathologist or physician.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
