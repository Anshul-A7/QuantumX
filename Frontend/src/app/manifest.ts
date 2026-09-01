import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuantumX — Hybrid Quantum-Classical Machine Learning Platform",
    short_name: "QuantumX",
    description:
      "QuantumX applies hybrid quantum-classical models to multi-omics and clinical data for early disease detection with mathematical rigor.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0d14",
    theme_color: "#1E3A8A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
