import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantumX | Under Development",
  description: "Hybrid Quantum ML Diagnostics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
