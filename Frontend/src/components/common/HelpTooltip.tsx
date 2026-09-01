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
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 p-2.5 bg-ink text-parchment text-[11px] font-sans font-light rounded-xl shadow-lg border border-hairline/20 z-50 pointer-events-none leading-relaxed text-left"
          >
            {title && <span className="font-semibold block mb-0.5 text-parchment">{title}</span>}
            <span className="text-parchment/90">{text}</span>
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
