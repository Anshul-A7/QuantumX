"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  User,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "assistant" | "user";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "How does the Quantum model detect subtle disease signs?",
  "What is the difference between Quantum and Classical models?",
];

export default function QuantumChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedTextMap, setDisplayedTextMap] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Sync user name & avatar from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("quantumx_user_name");
      const storedAvatar = localStorage.getItem("quantumx_user_avatar");
      if (storedName && storedName !== "Dr. Eleanor Vance") {
        setUserName(storedName);
      }
      if (storedAvatar) {
        setUserAvatar(storedAvatar);
      }

      // Listen for profile updates
      const handleStorage = () => {
        const n = localStorage.getItem("quantumx_user_name");
        const a = localStorage.getItem("quantumx_user_avatar");
        if (n && n !== "Dr. Eleanor Vance") setUserName(n);
        if (a) setUserAvatar(a);
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);

  const getWelcomeText = () => {
    return `Hi ${userName}! 👋 I'm QuantumX, your AI assistant.\n\nI can help you with:\n• Breast cancer, heart & kidney screening\n• Quantum vs Classical benchmarks\n• IBM Quantum hardware & ZNE mitigation\n• QXplain gate attribution & circuits\n\nWhat would you like to know?`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedTextMap, isThinking]);

  // Initial thinking + typewriter on first opening
  useEffect(() => {
    if (isOpen && !hasInitializedRef.current && messages.length === 0) {
      hasInitializedRef.current = true;
      setIsThinking(true);

      const welcomeStr = getWelcomeText();
      const thinkTimer = setTimeout(() => {
        setIsThinking(false);
        const welcomeMsg: ChatMessage = {
          id: "msg-welcome",
          sender: "assistant",
          text: welcomeStr,
          timestamp: "Just now",
        };
        setMessages([welcomeMsg]);
        startTypewriter("msg-welcome", welcomeStr);
      }, 400);

      return () => clearTimeout(thinkTimer);
    }
  }, [isOpen, messages.length, userName]);

  const startTypewriter = (msgId: string, fullText: string) => {
    setTypingMessageId(msgId);
    let currIdx = 0;
    setDisplayedTextMap((prev) => ({ ...prev, [msgId]: "" }));

    const interval = setInterval(() => {
      currIdx += 3; // Fast, smooth streaming
      if (currIdx >= fullText.length) {
        setDisplayedTextMap((prev) => ({ ...prev, [msgId]: fullText }));
        setTypingMessageId(null);
        clearInterval(interval);
      } else {
        setDisplayedTextMap((prev) => ({
          ...prev,
          [msgId]: fullText.slice(0, currIdx),
        }));
      }
    }, 12);
  };

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes("advantage") || q.includes("better") || q.includes("difference") || q.includes("classical")) {
      return "Traditional computer models process patient metrics independently. Quantum Variational Classifiers use entangled qubits to analyze complex, non-linear relationships across all symptoms simultaneously, yielding up to a +4.2% accuracy advantage on difficult cardiac and oncology cases.";
    }

    if (q.includes("noise") || q.includes("extrapolation") || q.includes("zne") || q.includes("mitigation")) {
      return "Zero-Noise Extrapolation (ZNE) is our error mitigation protocol. Because quantum hardware experiences tiny thermal variations, ZNE artificially scales noise upwards in steps and calculates backward mathematically to estimate the pure, zero-noise medical reading.";
    }

    if (q.includes("zz") || q.includes("feature map") || q.includes("entangle")) {
      return "The ZZ Feature Map encodes numeric patient test measurements into quantum rotation angles (Rz gates) and creates phase entanglement (CNOT gates) between paired qubits. This projects patient data into high-dimensional quantum Hilbert space where disease boundaries are clearly separable.";
    }

    if (q.includes("breast") || q.includes("cancer") || q.includes("tumor") || q.includes("malignant")) {
      return "The Breast Cancer module evaluates 8 cellular characteristics: cell radius, texture, perimeter, nuclear area, smoothness, compactness, concavity depth, and concave notch count. Irregular borders and high concavity depths are the primary indicators of malignancy.";
    }

    if (q.includes("heart") || q.includes("cardio") || q.includes("vessel") || q.includes("ecg")) {
      return "The Heart Disease module analyzes cardiovascular stress test markers: resting blood pressure, cholesterol, max exercise heart rate (thalach), ECG ST depression (oldpeak), and fluoroscopy vessel narrowing. The quantum model excels at detecting subtle multi-factor ischemia.";
    }

    if (q.includes("kidney") || q.includes("renal") || q.includes("creatinine") || q.includes("urea")) {
      return "The Kidney Disease module screens for early renal decline using serum creatinine, urine specific gravity, albumin protein in urine, blood urea nitrogen (BUN), and blood glucose. Elevated creatinine (> 1.4 mg/dl) with proteinuria strongly flags chronic kidney disease risk.";
    }

    if (q.includes("hi") || q.includes("hello") || q.includes("help")) {
      return `Hello ${userName}! I'm here to assist you with interpreting patient screening reports, understanding quantum gate attributions, or explaining model benchmark statistics.`;
    }

    return "Our hybrid quantum diagnostic architecture executes 8-qubit parameter circuits compiled via Qiskit Runtime. Each prediction yields a confidence score alongside QXplain gate attribution, identifying exactly which biomarkers influenced the medical recommendation.";
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      const replyText = generateAnswer(text);
      const newBotId = `b-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: newBotId,
        sender: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      startTypewriter(newBotId, replyText);
    }, 550);
  };

  const handleResetChat = () => {
    setMessages([]);
    setDisplayedTextMap({});
    hasInitializedRef.current = false;
    setIsThinking(true);
    const welcomeStr = getWelcomeText();
    setTimeout(() => {
      setIsThinking(false);
      const welcomeMsg: ChatMessage = {
        id: "msg-welcome-reset",
        sender: "assistant",
        text: welcomeStr,
        timestamp: "Just now",
      };
      setMessages([welcomeMsg]);
      startTypewriter("msg-welcome-reset", welcomeStr);
    }, 400);
  };

  // Platform Star Logo Icon
  const QuantumStarIcon = ({ size = 14 }: { size?: number }) => (
    <Sparkles size={size} className="text-white fill-white/10" />
  );

  return (
    <div className="fixed bottom-11 right-9 z-50 font-sans">
      {/* Floating Trigger Button with Rotating Rainbow Border */}
      <div className="relative group flex items-center justify-center">
        <div className="absolute -inset-[2.5px] rounded-full overflow-hidden opacity-90 group-hover:opacity-100 transition-opacity">
          <div
            className="w-full h-full animate-rainbow-spin"
            style={{
              background:
                "conic-gradient(from 0deg, #ff4545, #00ffcc, #0070f3, #7928ca, #ff007a, #ffbb00, #00ffcc, #ff4545)",
            }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Quantum AI Assistant"
          title="QuantumX AI Assistant"
          className="relative w-12 h-12 rounded-full bg-black text-white shadow-xl flex items-center justify-center cursor-pointer transition-all z-10"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X size={19} className="text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="bot"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Sparkles size={21} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Floating Chat Window Modal (Exact UI Match) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 25, y: 25 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 25, y: 25 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{ transformOrigin: "bottom right" }}
            className={`absolute bottom-8 right-16 ${
              isExpanded ? "w-[380px] sm:w-[460px] h-[540px]" : "w-[330px] sm:w-[370px] h-[450px]"
            } bg-white rounded-[26px] border border-gray-200/90 shadow-2xl flex flex-col overflow-hidden z-50 transition-all duration-200 ring-1 ring-black/5`}
          >
            {/* Header (Matching Reference Design) */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Squircle Quantum Star Icon */}
                <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs shrink-0">
                  <QuantumStarIcon size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                    QuantumX
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-[11px] text-emerald-600 font-medium">
                      AI Assistant
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation"
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse" : "Expand"}
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area (Hidden Scrollbars) */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar bg-white">
              {messages.map((msg) => {
                const isAssistant = msg.sender === "assistant";
                const isStreaming = typingMessageId === msg.id;
                const displayText = isStreaming
                  ? displayedTextMap[msg.id] ?? ""
                  : isAssistant
                  ? displayedTextMap[msg.id] ?? msg.text
                  : msg.text;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 items-start ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <QuantumStarIcon size={14} />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] space-y-1 ${
                        msg.sender === "user"
                          ? "bg-[#18181B] text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-xs"
                          : "bg-[#F4F4F6] text-gray-800 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs border border-gray-100/70"
                      }`}
                    >
                      <p className="font-normal text-[12.5px] leading-relaxed whitespace-pre-line">
                        {displayText}
                        {isStreaming && (
                          <span className="inline-block w-1 h-3 bg-emerald-500 ml-0.5 align-middle animate-pulse" />
                        )}
                      </p>
                    </div>

                    {/* User Profile Avatar */}
                    {msg.sender === "user" && (
                      <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5 overflow-hidden shadow-2xs border border-gray-200">
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={13} className="text-white" />
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Clickable Centered Suggestions (Visible only before 1st user message) */}
              {messages.length === 1 && !isThinking && typingMessageId === null && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center justify-center text-center space-y-2 pt-2 pb-1"
                >
                  <span className="text-[9.5px] text-gray-400 font-mono flex items-center justify-center gap-1 uppercase tracking-wider">
                    <Sparkles size={10} className="text-emerald-500" />
                    Suggested questions
                  </span>
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full max-w-[94%] px-3.5 py-2 rounded-full bg-white hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-500/40 text-[11px] text-gray-700 hover:text-emerald-900 transition-all cursor-pointer font-medium text-center shadow-2xs flex items-center justify-center gap-2 group"
                      >
                        <span className="text-emerald-500 text-[11px] group-hover:scale-115 transition-transform">
                          ✦
                        </span>
                        <span className="leading-snug">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Thinking Indicator */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5 items-center"
                >
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                    <QuantumStarIcon size={14} />
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#F4F4F6] border border-gray-100 shadow-2xs">
                    <span className="text-[11px] text-gray-500 font-medium">Thinking</span>
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer with helper label */}
            <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-[#F4F4F6] rounded-2xl p-1 pl-3.5 border border-gray-200/70 focus-within:border-gray-400 focus-within:bg-white transition-all"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about screening, detection, API..."
                  className="flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking || typingMessageId !== null}
                  className="w-8 h-8 rounded-xl bg-gray-200 hover:bg-black hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-gray-200 disabled:hover:text-gray-600 shrink-0"
                >
                  <Send size={13} />
                </button>
              </form>

              <span className="text-[10px] text-gray-400 text-center block pt-0.5 pb-0.5 font-light">
                Enter to send · Shift+Enter for newline
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
