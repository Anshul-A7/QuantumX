import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  href?: string | false;
}

export default function BrandLogo({ className = "", href = "/home" }: BrandLogoProps) {
  const content = (
    <span className={`inline-flex items-baseline gap-2 group ${className}`}>
      <span className="font-serif text-[22px] font-medium tracking-tight text-ink group-hover:opacity-90 transition-opacity">
        QuantumX
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-quantum font-semibold">
        Platform
      </span>
    </span>
  );

  if (href === false) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
