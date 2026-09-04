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

const ALL_PROMPTS = [
  "How does the Quantum model detect subtle disease signs?",
  "What is the difference between Quantum and Classical models?",
  "Summarize my recent patient screening cases",
  "How does the s_K ≥ 1.2 geometric advantage metric work?",
  "How does Zero-Noise Extrapolation (ZNE) mitigate noise?",
  "Explain the primary shape factors in breast cancer screening",
  "What are the McNemar χ² statistical significance results?",
  "How does QXplain calculate gate ablation saliency maps?",
  "What is the role of the ZZ-feature map in data encoding?",
  "How does Parameter-Shift compute quantum gradients?",
];

function getRandomPrompts(count: number = 2): string[] {
  const shuffled = [...ALL_PROMPTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Lightweight inline markdown formatter that converts **bold**, `code`, bullets and headings to clean JSX
 */
function FormattedMessage({ text, isBot }: { text: string; isBot: boolean }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-[12.5px] leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Headings (e.g. ### Heading)
        if (trimmed.startsWith("### ")) {
          const headingText = trimmed.replace(/^###\s+/, "");
          return (
            <h4 key={lineIdx} className={`font-serif font-semibold text-[13px] mt-1.5 mb-0.5 ${isBot ? "text-ink" : "text-white"}`}>
              {parseInlineMarkdown(headingText, isBot)}
            </h4>
          );
        }

        // Bullets (e.g. - item or • item or 1. item)
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+\.\s/.test(trimmed);
        if (isBullet) {
          const bulletContent = trimmed.replace(/^[-•]\s+|\d+\.\s+/, "");
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className={`text-[10px] mt-0.5 ${isBot ? "text-quantum" : "text-parchment"}`}>•</span>
              <span className="flex-1">{parseInlineMarkdown(bulletContent, isBot)}</span>
            </div>
          );
        }

        return (
          <p key={lineIdx} className="my-0.5">
            {parseInlineMarkdown(line, isBot)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string, isBot: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Matches **bold**, `code`, or unclosed ** during streaming
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*\*[^*]+$)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong
          key={`${match.index}-b`}
          className={`font-bold ${isBot ? "text-black drop-shadow-xs" : "text-white"}`}
        >
          {boldText}
        </strong>
      );
    } else if (token.startsWith("**") && !token.endsWith("**")) {
      // Halfway streaming bold
      const boldText = token.slice(2);
      parts.push(
        <strong
          key={`${match.index}-b-streaming`}
          className={`font-bold ${isBot ? "text-black" : "text-white"}`}
        >
          {boldText}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={`${match.index}-c`}
          className={`font-mono text-[11px] px-1 py-0.5 rounded font-medium ${
            isBot ? "bg-cream-deep/90 text-ink border border-hairline/60" : "bg-white/20 text-white"
          }`}
        >
          {codeText}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts;
}

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
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Randomize suggestions when opened
  useEffect(() => {
    if (isOpen) {
      setSuggestedPrompts(getRandomPrompts(2));
    }
  }, [isOpen]);

  // Sync user profile & recent screenings
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
    return `Hi ${userName}! 👋\n\nHow can I help you with your quantum medical research or patient screening today?`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedTextMap, isThinking]);

  // Initial welcome on first opening
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
      }, 150);

      return () => clearTimeout(thinkTimer);
    }
  }, [isOpen, messages.length, userName]);

  const startTypewriter = (msgId: string, fullText: string) => {
    setTypingMessageId(msgId);
    let currIdx = 0;
    setDisplayedTextMap((prev) => ({ ...prev, [msgId]: "" }));

    const interval = setInterval(() => {
      currIdx += 10; // Ultra-fast streaming
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
    }, 8);
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
        text: "The clinical query engine is online. You can view all diagnostic details in the [Screening History](/history) and [Benchmarks](/benchmarks) dashboards.",
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
    setSuggestedPrompts(getRandomPrompts(2));
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
    }, 150);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button with Rotating Rainbow Glow Border */}
      <div className="relative group flex items-center justify-center">
        <div className="absolute -inset-[2px] rounded-full overflow-hidden pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
          <div
            className="absolute -inset-[50%] animate-rainbow-spin"
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
          aria-label={isOpen ? "Close Quantum AI Assistant" : "Open Quantum AI Assistant"}
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
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-x-3 bottom-20 sm:inset-auto sm:absolute sm:bottom-16 sm:right-0 ${
              isExpanded
                ? "sm:w-[660px] h-[82vh] max-h-[820px]"
                : "sm:w-[420px] h-[580px] max-h-[calc(100vh-120px)]"
            } bg-parchment rounded-3xl border border-hairline/90 shadow-[0_25px_70px_-15px_rgba(40,30,20,0.35)] flex flex-col overflow-hidden transition-all duration-300 z-50`}
          >
            {/* Window Header */}
            <div className="px-5 py-4 border-b border-hairline bg-cream/70 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={16} className="text-quantum" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-medium text-ink tracking-tight">QuantumX</span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-quantum bg-quantum/10 border border-quantum/20 px-1.5 py-0.5 rounded-full font-semibold">
                      Clinical AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Online</span>
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
                const rawText = displayedTextMap[msg.id] ?? msg.text;

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
                      <FormattedMessage text={rawText} isBot={isBot} />
                      {isTyping && <span className="inline-block w-1.5 h-3 bg-quantum ml-1 animate-pulse" />}
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

              {/* Minimal Thinking Animation (Only bouncing dots) */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 text-xs text-ink-soft"
                >
                  <div className="w-7 h-7 rounded-xl bg-black text-white shrink-0 flex items-center justify-center shadow-2xs">
                    <Sparkles size={13} className="text-quantum" />
                  </div>
                  <div className="bg-cream-deep/60 border border-hairline/90 px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Simple Random Suggestions Area (No category banner, clean pills) */}
            {suggestedPrompts.length > 0 && (
              <div className="px-4 py-2.5 bg-cream/40 border-t border-hairline/70 flex flex-col gap-1.5">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p)}
                    className="w-full text-left text-[11.5px] px-3.5 py-2 rounded-2xl bg-parchment hover:bg-cream-deep border border-hairline/90 text-ink transition-all cursor-pointer font-normal hover:border-quantum/50 shadow-2xs flex items-center gap-2 group"
                  >
                    <span className="text-quantum text-[11px] group-hover:scale-110 transition-transform">✦</span>
                    <span className="truncate">{p}</span>
                  </button>
                ))}
              </div>
            )}

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
                placeholder="Ask about screening, detection, API..."
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
