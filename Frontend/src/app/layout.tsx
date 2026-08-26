import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import QuantumCanvas from "@/components/ui/QuantumCanvas";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "QuantumX | Hybrid Quantum Machine Learning Diagnostics",
  description: "Next-generation biomedical diagnostic platform leveraging hybrid variational quantum circuits and Q-SHAP explainability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} cream-gradient text-slate-900 min-h-screen relative antialiased selection:bg-indigo-500/20 selection:text-indigo-900`}>
        <QuantumCanvas />
        <SmoothScrollProvider>
          <div className="relative z-10">
            {children}
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
