"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HelpTooltipProps {
  text: string;
  title?: string;
  className?: string;
}

export default function HelpTooltip({ text, title, className = "" }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <button
        type="button"
        aria-label="Help information"
        className="w-4 h-4 rounded-full text-ink-soft hover:text-quantum hover:bg-quantum/10 flex items-center justify-center transition-colors cursor-pointer"
      >
        <HelpCircle size={12} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-ink text-parchment text-[11px] font-sans font-normal rounded-xl shadow-xl border border-hairline/30 z-[100] pointer-events-none leading-relaxed text-left"
          >
            {title && <span className="font-bold block mb-1 text-quantum">{title}</span>}
            <span className="text-parchment/95">{text}</span>
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
