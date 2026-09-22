"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, ShieldAlert, User as UserIcon, Sparkles, HeartPulse, Stethoscope } from "lucide-react";

interface AiDoctorConsultationTabProps {
  patientInfo: {
    name: string;
    patient_id: string;
    age: number;
    gender: string;
  };
  telemetry: any;
  activeEngine: string;
  aiSynthesis: any;
}

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

function QuantumXLogo({ size = 26 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs border border-white/10"
    >
      <svg viewBox="0 0 32 32" className="w-[60%] h-[60%]" fill="none">
        <path
          d="M16 5 L17.5 13.5 L26 15 L17.5 16.5 L16 25 L14.5 16.5 L6 15 L14.5 13.5 Z"
          fill="#FFFFFF"
        />
        <circle cx="16" cy="15" r="2.2" fill="#10B981" />
        <circle cx="9" cy="8" r="1.2" fill="#10B981" opacity="0.8" />
        <circle cx="23" cy="22" r="1.2" fill="#10B981" opacity="0.8" />
      </svg>
    </div>
  );
}

function FormattedMessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-1" />;

        if (trimmed === "---" || trimmed === "___") {
          return <hr key={lIdx} className="my-2 border-hairline/60" />;
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
        const rawLine = isBullet ? trimmed.replace(/^[•\-]\s*/, "") : line;

        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;

        while ((match = boldRegex.exec(rawLine)) !== null) {
          if (match.index > lastIndex) {
            elements.push(rawLine.substring(lastIndex, match.index));
          }
          elements.push(
            <strong key={match.index} className="font-bold text-ink">
              {match[1]}
            </strong>
          );
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < rawLine.length) {
          elements.push(rawLine.substring(lastIndex));
        }

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-1">
              <span className="text-quantum font-bold shrink-0">•</span>
              <span className="flex-1">{elements}</span>
            </div>
          );
        }

        return <div key={lIdx}>{elements}</div>;
      })}
    </div>
  );
}

export default function AiDoctorConsultationTab({
  patientInfo,
  telemetry,
  activeEngine,
  aiSynthesis,
}: AiDoctorConsultationTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pName = patientInfo?.name || "Patient";
  const pId = patientInfo?.patient_id || "QX-ECG-1001";
  const pAge = patientInfo?.age || 55;
  const pGender = patientInfo?.gender || "Male";

  const diagTitle = telemetry?.prediction?.clinical_title || "Normal Sinus Rhythm (Physiological)";
  const riskScore = telemetry?.risk_stratification?.cardiac_risk_score ?? 2.0;
  const tier = telemetry?.risk_stratification?.severity_tier || "LOW RISK (NORMAL SINUS RHYTHM)";
  const lead = telemetry?.pinpointing_gradcam?.lead_detected || "Lead V2 (Septal)";
  const region = telemetry?.pinpointing_gradcam?.anatomical_region || "Anteroseptal Junction (LAD)";
  const recommendation = telemetry?.risk_stratification?.clinical_recommendation || "Physiological rhythm verified.";

  useEffect(() => {
    const summaryText = aiSynthesis?.summary_paragraph || aiSynthesis?.summary || "";
    const introMessage = `Hello. I am your **QuantumX AI Cardiologist**, providing second-opinion clinical decision support for **${pName}** (${pId}, ${pAge}y ${pGender}).

---

### **Clinical Electrocardiographic Assessment**
• **Diagnostic Finding:** **${diagTitle}**
• **Continuous Cardiac Risk Score:** **${riskScore} / 100**
• **Severity Triage Tier:** **${tier}**
• **Anatomical Lead Trigger:** **${lead}** (${region})
• **Model Signature:** **${activeEngine}**

---

### **Clinical Summary & Guidance**
${summaryText || recommendation}

---
*Feel free to ask any specific questions regarding door-to-balloon cath protocols, ST-segment deviations, pharmacotherapy, or differential diagnoses.*`;

    setMessages([
      {
        role: "assistant",
        content: introMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [patientInfo, telemetry, activeEngine, aiSynthesis]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const question = textToSend || inputValue.trim();
    if (!question || isTyping) return;

    const userMsg: Message = {
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    try {
      const prompt = `You are an expert cardiologist providing clinical second-opinion decision support on a patient's 12-lead ECG.
Patient Context:
- Name: ${pName} (${pId}), ${pAge} y/o ${pGender}
- Finding: ${diagTitle}
- Risk Score: ${riskScore}/100 (${tier})
- Primary Lead: ${lead} (${region})
- Action: ${recommendation}

Question from Clinician: "${question}"

Provide a concise, highly professional, evidence-based response (2-3 short paragraphs or bullet points). Mention clinical guideline standards (AHA/ACC or ESC).`;

      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      let answer = "";

      if (geminiApiKey) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3 },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
      }

      if (!answer) {
        // High-signal knowledgebase fallback
        const qLower = question.toLowerCase();
        if (qLower.includes("pci") || qLower.includes("cath") || qLower.includes("emergency")) {
          answer = `### **Emergency Cath Lab & Revascularization Protocol**\n• For acute STEMI patterns, guideline door-to-balloon time is **<90 minutes** (AHA/ACC).\n• If PCI capability is unavailable within 120 minutes, consider immediate intravenous fibrinolytic therapy within 30 minutes of arrival.\n• Immediate dual antiplatelet therapy (Aspirin 325 mg chewed + Ticagrelor 180 mg or Clopidogrel 600 mg loading dose) and unfractionated heparin bolus is recommended prior to catheterization.`;
        } else if (qLower.includes("lead") || qLower.includes("st") || qLower.includes("morphology")) {
          answer = `### **Lead Attribution Analysis (${lead})**\n• The primary neural attention is centered on **${lead}**, corresponding to the **${region}**.\n• In the standard 12-lead vector system, V1-V2 elevation reflects anteroseptal involvement typically supplied by the Left Anterior Descending (LAD) coronary artery.\n• Reciprocal ST depression in inferior leads (II, III, aVF) should be cross-examined to confirm acute transmural injury versus benign repolarization.`;
        } else if (qLower.includes("drug") || qLower.includes("medication") || qLower.includes("treatment")) {
          answer = `### **Guideline-Directed Pharmacotherapy**\n• **Antiplatelet:** Dual antiplatelet therapy (Aspirin + P2Y12 inhibitor).\n• **Anticoagulation:** Weight-adjusted Heparin or Enoxaparin.\n• **Anti-ischemic:** Sublingual nitroglycerin (if systolic BP >90 mmHg and no right ventricular involvement) and beta-blockade once hemodynamically stabilized.\n• **Lipid lowering:** High-intensity Statin (Atorvastatin 80 mg daily).`;
        } else {
          answer = `### **Cardiological Second Opinion**\nFor **${pName}**, the overall continuous cardiac risk score of **${riskScore}/100** classifies the presentation under **${tier}**.\n\n• The anatomical focus on **${lead}** suggests that serial 12-lead ECGs (every 15-30 minutes) should be performed to monitor dynamic ST-segment evolution.\n• Complementary baseline diagnostics should include high-sensitivity cardiac troponin (hs-cTnI/T), serum potassium, magnesium, and an emergency bedside point-of-care echocardiogram (POCUS) to evaluate wall motion abnormalities.`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e) {
      console.warn("Cardiologist chat error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `For **${pName}**, continuous telemetric cardiac monitoring and correlation with clinical anginal symptoms and serial troponin biomarkers is advised.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const SUGGESTED_QUESTIONS = [
    "Emergency Cath Lab & Door-to-Balloon Protocol",
    `Analyze Lead Attribution in ${lead}`,
    "Guideline Pharmacotherapy & Anticoagulation",
    "Differential Diagnoses & Reciprocal Changes",
  ];

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden flex flex-col h-[640px]">
      {/* Consultation Header */}
      <div className="p-4 border-b border-hairline flex items-center justify-between bg-cream/20">
        <div className="flex items-center gap-3">
          <QuantumXLogo size={32} />
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <span>QuantumX AI Cardiologist</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-ink-soft">
              Real-time clinical consultation for {pName} ({pId}) • {diagTitle}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-ink-soft">
          <Stethoscope size={14} className="text-quantum" />
          <span>SIH26139 ACC/AHA Standard</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-cream/10">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {isUser ? (
                <div className="w-7 h-7 rounded-lg bg-ink text-parchment flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <UserIcon size={14} />
                </div>
              ) : (
                <QuantumXLogo size={28} />
              )}

              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-ink text-parchment rounded-tr-xs"
                    : "bg-white text-ink border border-hairline rounded-tl-xs"
                }`}
              >
                <FormattedMessageContent content={msg.content} />
                <span
                  className={`text-[9px] font-mono block mt-2 ${
                    isUser ? "text-parchment/60 text-right" : "text-ink-soft"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <QuantumXLogo size={28} />
            <div className="p-3.5 rounded-2xl bg-white border border-hairline text-xs font-mono text-ink-soft flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce" />
              <span>Analyzing cardiac electrophysiology...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="px-4 py-2 border-t border-hairline bg-cream/30 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-ink-soft shrink-0">Quick Inquiries:</span>
        {SUGGESTED_QUESTIONS.map((q, qIdx) => (
          <button
            key={qIdx}
            type="button"
            onClick={() => handleSendMessage(q)}
            disabled={isTyping}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-cream border border-hairline text-ink shrink-0 transition-all cursor-pointer shadow-2xs hover:border-quantum disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-hairline bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask AI Cardiologist about ECG waveforms, emergency protocols, medications..."
          disabled={isTyping}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-hairline bg-cream/20 hover:bg-cream/40 focus:bg-white text-xs text-ink focus:outline-none focus:border-quantum disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isTyping || !inputValue.trim()}
          className="px-4 py-2.5 rounded-xl bg-ink hover:bg-ink/90 text-parchment text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-40"
        >
          <Send size={13} className="text-quantum" />
          <span>Consult</span>
        </button>
      </form>
    </div>
  );
}
