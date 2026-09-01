"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  User,
  RefreshCw,
  Cpu,
  Layers,
  FileText,
  Activity,
} from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { ScreeningService, type StoredPrediction } from "@/services/screening.service";
import { useQuantumBackend } from "@/hooks/useQuantumBackend";

interface ChatMessage {
  id: string;
  sender: "assistant" | "user";
  text: string;
  timestamp: string;
}

const SUGGESTION_GROUPS = [
  {
    category: "Screening & Patient Reports",
    icon: FileText,
    prompts: [
      "Summarize my recent patient screening records",
      "Why was my latest patient classified as high risk?",
      "What are the primary cellular shape drivers in breast cancer?",
    ],
  },
  {
    category: "Quantum vs Classical Benchmarks",
    icon: Activity,
    prompts: [
      "What is the difference between Quantum VQC and XGBoost?",
      "What are the McNemar χ² test results in the BVP protocol?",
      "Explain Cohen's d effect size on WDBC classification",
    ],
  },
  {
    category: "Theoretical Advantage (s_K) & Circuits",
    icon: Layers,
    prompts: [
      "How does the s_K ≥ 1.2 geometric advantage metric work?",
      "Explain the ZZ-feature map state encoding formula",
      "How does the Parameter-Shift rule calculate quantum gradients?",
    ],
  },
  {
    category: "Hardware & Error Mitigation",
    icon: Cpu,
    prompts: [
      "How does Zero-Noise Extrapolation (ZNE) mitigate NISQ noise?",
      "What is the difference between statevector simulation and IBM QPU?",
      "How does QXplain calculate gate ablation saliency maps?",
    ],
  },
];

export default function QuantumChatbot() {
  const pathname = usePathname();
  const { backend: activeBackend } = useQuantumBackend();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedTextMap, setDisplayedTextMap] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState("Investigator");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [recentScreenings, setRecentScreenings] = useState<StoredPrediction[]>([]);
  const [suggestionGroupIdx, setSuggestionGroupIdx] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Sync user profile & recent screenings from Supabase
  useEffect(() => {
    const cachedUser = AuthService.getCachedUser();
    if (cachedUser) {
      setUserName(cachedUser.fullName || cachedUser.username || "Investigator");
      setUserEmail(cachedUser.email || "");
      if (cachedUser.profileImageUrl) setUserAvatar(cachedUser.profileImageUrl);
    }

    ScreeningService.getScreenings()
      .then((records) => setRecentScreenings(records || []))
      .catch(() => {});
  }, [isOpen]);

  const getWelcomeText = () => {
    const count = recentScreenings.length;
    return `Hi ${userName}! 👋 I'm **QuantumX AI**, your specialized clinical intelligence assistant.\n\nI have real-time access to your **${count} saved patient diagnostic record(s)** and the **${activeBackend === "ibmq_eagle" ? "IBM Quantum Eagle 127Q" : "GPU Simulator"}** backend.\n\nWhat would you like to investigate today?`;
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
      }, 350);

      return () => clearTimeout(thinkTimer);
    }
  }, [isOpen, messages.length, userName, recentScreenings.length]);

  const startTypewriter = (msgId: string, fullText: string) => {
    setTypingMessageId(msgId);
    let currIdx = 0;
    setDisplayedTextMap((prev) => ({ ...prev, [msgId]: "" }));

    const interval = setInterval(() => {
      currIdx += 4; // Fast, responsive streaming
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
    }, 10);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsThinking(true);

    try {
      const payload = {
        message: text,
        conversationHistory: messages.slice(-6),
        userContext: {
          userName,
          userEmail,
          activeBackend: activeBackend === "ibmq_eagle" ? "IBM Quantum Eagle (127-Qubit)" : "GPU Statevector Simulator",
          currentPath: pathname,
          recentScreenings: recentScreenings.slice(0, 10),
          totalScreeningsCount: recentScreenings.length,
        },
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const replyText = data.reply || "QuantumX AI received your query. Please refer to the benchmark and screening dashboards.";

      const newBotId = `b-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: newBotId,
        sender: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setIsThinking(false);
      setMessages((prev) => [...prev, botMsg]);
      startTypewriter(newBotId, replyText);
    } catch {
      setIsThinking(false);
      const newBotId = `b-${Date.now()}`;
      const fallbackMsg: ChatMessage = {
        id: newBotId,
        sender: "assistant",
        text: "The clinical query engine is online. You can view all diagnostic details in the **[Screening History](/history)** and **[Benchmarks](/benchmarks)** dashboards.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      startTypewriter(newBotId, fallbackMsg.text);
    }
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
    }, 300);
  };

  const cycleSuggestions = () => {
    setSuggestionGroupIdx((prev) => (prev + 1) % SUGGESTION_GROUPS.length);
  };

  const currentSuggestions = SUGGESTION_GROUPS[suggestionGroupIdx];
  const SuggestionIcon = currentSuggestions.icon;

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
          title="QuantumX Clinical AI Assistant"
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

      {/* Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute bottom-16 right-0 ${
              isExpanded
                ? "w-[92vw] sm:w-[680px] h-[82vh] max-h-[820px]"
                : "w-[92vw] sm:w-[420px] h-[580px] max-h-[75vh]"
            } bg-parchment rounded-3xl border border-hairline/90 shadow-[0_25px_70px_-15px_rgba(40,30,20,0.35)] flex flex-col overflow-hidden transition-all duration-300 z-50`}
          >
            {/* Window Header */}
            <div className="px-5 py-4 border-b border-hairline bg-cream/70 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={16} className="text-quantum animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-medium text-ink tracking-tight">QuantumX</span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-quantum bg-quantum/10 border border-quantum/20 px-1.5 py-0.5 rounded-full font-semibold">
                      Clinical AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Gemini 2.5 Intelligence · {recentScreenings.length} Cases Synced</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-ink-soft">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg hover:bg-cream-deep/70 hover:text-ink transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse window" : "Expand window"}
                  className="p-1.5 rounded-lg hover:bg-cream-deep/70 hover:text-ink transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="p-1.5 rounded-lg hover:bg-cream-deep/70 hover:text-ink transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-sans">
              {messages.map((msg) => {
                const isBot = msg.sender === "assistant";
                const isTyping = typingMessageId === msg.id;
                const displayText = displayedTextMap[msg.id] ?? msg.text;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}
                  >
                    {isBot && (
                      <div className="w-7 h-7 rounded-xl bg-black text-white shrink-0 flex items-center justify-center mt-0.5 shadow-2xs">
                        <Sparkles size={13} className="text-quantum" />
                      </div>
                    )}

                    <div
                      className={`max-w-[84%] rounded-2xl p-3.5 leading-relaxed ${
                        isBot
                          ? "bg-cream-deep/60 border border-hairline/90 text-ink shadow-2xs"
                          : "bg-ink text-parchment font-medium shadow-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-normal text-[12.5px] leading-relaxed">
                        {displayText}
                        {isTyping && <span className="inline-block w-1.5 h-3 bg-quantum ml-1 animate-pulse" />}
                      </div>
                      <span
                        className={`block text-[9px] font-mono mt-1.5 ${
                          isBot ? "text-ink-soft/70 text-left" : "text-parchment/60 text-right"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {!isBot && (
                      <div className="w-7 h-7 rounded-full bg-cream-deep border border-hairline text-ink shrink-0 flex items-center justify-center mt-0.5 overflow-hidden text-[10px] font-serif font-bold">
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          userName.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 text-xs text-ink-soft"
                >
                  <div className="w-7 h-7 rounded-xl bg-black text-white shrink-0 flex items-center justify-center shadow-2xs">
                    <Sparkles size={13} className="text-quantum animate-spin" />
                  </div>
                  <div className="bg-cream-deep/50 border border-hairline px-3.5 py-2 rounded-2xl flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:0.3s]" />
                    <span className="text-[11px] font-mono text-ink-soft ml-1">Analyzing Quantum Pipeline &amp; DB...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Suggestions Carousel */}
            <div className="px-4 py-2 bg-cream/50 border-t border-hairline/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ink-soft flex items-center gap-1.5">
                  <SuggestionIcon size={11} className="text-quantum" />
                  {currentSuggestions.category}
                </span>
                <button
                  type="button"
                  onClick={cycleSuggestions}
                  className="text-[10px] font-mono text-quantum hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  title="Cycle to next suggestion set"
                >
                  <RefreshCw size={10} /> Next Topics
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {currentSuggestions.prompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p)}
                    className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-parchment hover:bg-cream-deep border border-hairline text-ink transition-all cursor-pointer font-medium hover:border-quantum/50 shadow-2xs"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-cream border-t border-hairline flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about patient reports, s_K formulas, ZNE, VQC..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-parchment border border-hairline text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="w-10 h-10 rounded-2xl bg-ink text-parchment hover:opacity-90 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                title="Send query"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
