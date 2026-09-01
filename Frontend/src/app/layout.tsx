import type { Metadata, Viewport } from "next";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quantumx-health.vercel.app";

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "QuantumX — Hybrid Quantum-Classical ML for Early Disease Detection",
    template: "%s | QuantumX",
  },
  description:
    "QuantumX applies hybrid quantum-classical machine learning to biomedical and multi-omics data, featuring geometric advantage pre-screening (s_K), variational quantum classifiers, and gate-level causal explainability.",
  keywords: [
    "Quantum Machine Learning",
    "Hybrid Quantum-Classical ML",
    "Variational Quantum Circuit",
    "VQC",
    "Early Disease Detection",
    "Breast Cancer Cytology",
    "WDBC Dataset",
    "Quantum Advantage Screening",
    "PennyLane",
    "Qiskit",
    "Explainable AI",
    "QXplain",
    "Gate Ablation Saliency",
    "Biomedical AI Diagnostics",
    "SIH26139",
  ],
  authors: [{ name: "QuantumX Engineering & Research Team" }],
  creator: "QuantumX",
  publisher: "QuantumX",
  applicationName: "QuantumX Diagnostic Platform",
  category: "Healthcare & Artificial Intelligence",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "QuantumX — Hybrid Quantum-Classical ML for Early Disease Detection",
    description:
      "Enterprise hybrid quantum-classical diagnostic platform evaluating 8-qubit VQCs against XGBoost and SVM baselines on identical patient splits.",
    url: siteUrl,
    siteName: "QuantumX Platform",
    images: [
      {
        url: "/assets/dashboard.jpg",
        width: 1200,
        height: 630,
        alt: "QuantumX Clinical Diagnostic Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuantumX — Hybrid Quantum-Classical ML for Early Disease Detection",
    description:
      "Enterprise hybrid quantum-classical diagnostic platform with geometric advantage pre-screening and gate ablation explainability.",
    images: ["/assets/dashboard.jpg"],
    creator: "@QuantumX_AI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "QuantumX",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web Browser",
      "url": siteUrl,
      "description":
        "QuantumX applies hybrid quantum-classical machine learning to biomedical and multi-omics data for high-confidence early disease detection.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "featureList": [
        "Geometric Advantage Pre-Screening (s_K score calculation)",
        "8-Qubit Variational Quantum Circuit (VQC) with Data Re-Uploading",
        "Dual-Path Hybrid Optimization (PyTorch Autograd & Parameter-Shift)",
        "Tri-Model Benchmark Verification Protocol (BVP)",
        "Gate-Level Quantum Causal Saliency (QXplain)",
        "Cryptographically Signed Quantum Diagnostic Receipts",
      ],
    },
    {
      "@type": "MedicalWebPage",
      "name": "QuantumX Early Disease Detection Platform",
      "url": siteUrl,
      "description":
        "Research and clinical benchmarking platform combining classical ensemble baselines with parameterized quantum circuits on biomedical datasets.",
      "aspect": ["diagnosis", "prediction", "explainability"],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body
        className={`${geist.variable} ${newsreader.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
