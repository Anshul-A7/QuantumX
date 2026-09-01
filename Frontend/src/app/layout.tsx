import type { Metadata } from "next";
import { Newsreader, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuantumX — Hybrid Quantum-Classical ML for Early Disease Detection",
  description:
    "QuantumX applies hybrid quantum-classical models to multi-omics and clinical data, with geometric pre-screening, quantum-native explainability, and benchmarking against classical baselines.",
  openGraph: {
    title: "QuantumX — Hybrid Quantum-Classical ML for Early Disease Detection",
    description:
      "Quantum kernels and variational classifiers evaluated honestly against XGBoost and SVM baselines on identical splits.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuantumX — Hybrid Quantum-Classical ML for Early Disease Detection",
    description:
      "A research platform for early disease detection on high-dimensional biomedical data.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={`${geist.variable} ${newsreader.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
