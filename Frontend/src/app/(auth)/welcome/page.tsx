"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function Typewriter({
  text,
  speed,
  active,
  onDone,
}: {
  text: string;
  speed: number;
  active: boolean;
  onDone?: () => void;
}) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setOut("");
      setDone(false);
      return;
    }
    setOut("");
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        setDone(true);
        if (onDoneRef.current) {
          onDoneRef.current();
        }
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed, active]);

  const cursor =
    !done && active ? (
      <span className="inline-block w-[2px] h-[0.9em] ml-1 align-middle bg-quantum animate-pulse" />
    ) : null;

  return (
    <>
      {out}
      {cursor}
    </>
  );
}

export default function WelcomeTransitionPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Doctor");
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [shown, setShown] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    setMounted(true);
    let resolvedName = "";
    if (typeof window !== "undefined") {
      const urlParamName = new URLSearchParams(window.location.search).get("name");
      const storedName = localStorage.getItem("quantumx_user_name");
      resolvedName = urlParamName || storedName || "";
    }
    resolvedName = resolvedName.replace(/_/g, " ").trim();
    if (!resolvedName || resolvedName.toLowerCase() === "anonymous" || resolvedName === "") {
      resolvedName = "Doctor";
    }
    setUserName(resolvedName);

    // Timeline of typing animations
    const t0 = setTimeout(() => setShown([true, false, false]), 80);
    const t1 = setTimeout(() => setShown([true, true, false]), 450);
    const t2 = setTimeout(() => setShown([true, true, true]), 1000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // When quote finishes typing: stay for 0.15s (150ms), then fade out to /home
  const handleQuoteFinished = () => {
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        router.push("/home");
      }, 250);
    }, 150);
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden font-sans select-none"
      style={{
        background: "#fafaf8",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(1.015)" : "scale(1)",
        filter: exiting ? "blur(4px)" : "blur(0px)",
        transition: "opacity 0.25s ease, transform 0.25s ease, filter 0.25s ease",
      }}
    >
      {/* Soft Ambient Radial Accents */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)" }}
        />

        {/* Fine Dot Grid */}
        {mounted && (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35 }}>
            <defs>
              <pattern id="grid-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.75" fill="#0f172a" opacity="0.08" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dots)" />
          </svg>
        )}

        {/* Subtle Corner Brackets */}
        {[
          ["top-8 left-8", "tl"],
          ["top-8 right-8", "tr"],
          ["bottom-8 left-8", "bl"],
          ["bottom-8 right-8", "br"],
        ].map(([pos, side]) => (
          <div
            key={side}
            className={`absolute ${pos} w-8 h-8`}
            style={{
              borderTop: ["tl", "tr"].includes(side) ? "1.5px solid rgba(15,23,42,0.12)" : undefined,
              borderBottom: ["bl", "br"].includes(side) ? "1.5px solid rgba(15,23,42,0.12)" : undefined,
              borderLeft: ["tl", "bl"].includes(side) ? "1.5px solid rgba(15,23,42,0.12)" : undefined,
              borderRight: ["tr", "br"].includes(side) ? "1.5px solid rgba(15,23,42,0.12)" : undefined,
              borderRadius:
                side === "tl" ? "10px 0 0 0" : side === "tr" ? "0 10px 0 0" : side === "bl" ? "0 0 0 10px" : "0 0 10px 0",
            }}
          />
        ))}
      </div>

      {/* Main Centered Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center space-y-4">
        {/* Line 0: Top Clean Tag */}
        <div
          className={`transition-all duration-500 ${
            shown[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-emerald-600 dark:text-emerald-500 font-semibold flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Typewriter
              text="QUANTUMX PLATFORM"
              speed={20}
              active={shown[0]}
            />
          </p>
        </div>

        {/* Line 1: Main Welcome Heading */}
        <div
          className={`transition-all duration-500 ${
            shown[1] ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <h1
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-foreground"
            style={{
              background: "linear-gradient(135deg, #090d16 0%, #1e293b 55%, #0d9488 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            <Typewriter
              text={`Welcome, ${userName}`}
              speed={28}
              active={shown[1]}
            />
          </h1>
        </div>

        {/* Line 2: The Small Simple Quote */}
        <div
          className={`transition-all duration-500 pt-1 ${
            shown[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <p className="text-base sm:text-lg md:text-xl font-light text-muted-foreground italic max-w-lg mx-auto leading-relaxed">
            &ldquo;
            <Typewriter
              text="Detecting disease earlier, with quantum computing."
              speed={18}
              active={shown[2]}
              onDone={handleQuoteFinished}
            />
            &rdquo;
          </p>
        </div>
      </div>

      {/* Bottom Pulse Dots */}
      <div
        className={`absolute bottom-8 left-0 right-0 flex justify-center items-center gap-2 transition-opacity duration-700 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-emerald-600"
            style={{
              animation: `welcomePulse 1.2s ease-in-out infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes welcomePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
