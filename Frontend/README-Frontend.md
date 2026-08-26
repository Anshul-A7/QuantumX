<div align="center">

# Frontend — QuantumX

[![Status](https://img.shields.io/badge/status-active%20development-yellow)]()
[![Python](https://img.shields.io/badge/backend-Python%203.12%2B-3776AB?logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/frontend-Next.js%2016-black?logo=next.js&logoColor=white)]()
[![Qiskit](https://img.shields.io/badge/quantum-Qiskit%20%7C%20PennyLane-6929C4)]()
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../LICENSE)

</div>

This folder owns the entire user interface and client-side experience for QuantumX. It is designed not just as a generic dashboard, but as a premium, research-grade medical workspace where clinicians and researchers can visualize the impact of quantum machine learning on high-dimensional biomedical data.

## Language & Framework: Next.js (App Router) & TypeScript

**Recommendation: Next.js 14+ using the App Router and strict TypeScript.**

**Why Next.js?** A machine learning platform handling complex quantum state data and high-dimensional features requires a robust, scalable frontend architecture. React is the industry standard for component-driven UI, but raw React (like Create React App or Vite) lacks built-in server-side rendering (SSR), optimized routing, and API abstraction. Next.js provides a production-ready framework that handles complex nested layouts efficiently. The **App Router** is explicitly chosen over the older Pages router because its server-first architecture and nested layouts cleanly support our complex authenticated workspace structure.

**Why strict TypeScript?** We are passing complex benchmarking objects, multi-dimensional SHAP values, and quantum circuit attributions back and forth from the FastAPI backend. Relying on implicit types or `any` in JavaScript will inevitably lead to runtime crashes during live demos. TypeScript provides a strict, typed contract between the frontend and the Python backend schemas.

## Tech Stack & Tooling

| Tool | Purpose | Why this choice? |
|---|---|---|
| **Tailwind CSS** | Styling | Utility-first CSS allows for rapid iteration of a premium dark-mode aesthetic without managing bloated stylesheet cascades. |
| **shadcn/ui** | Base Components | We need high-quality, accessible components (modals, data tables) but want full ownership of the code, not a bulky npm library dependency. |
| **Recharts** | Data Visualization | Essential for rendering classical/quantum performance benchmarks (AUC-ROC, accuracy) and side-by-side SHAP interpretability graphs. |
| **Framer Motion** | Micro-animations | A medical platform shouldn't feel dead. Subtle, purposeful micro-animations improve perceived performance and user engagement. |
| **Axios** | HTTP Client | Chosen for its robust interceptor support, which is critical for smoothly attaching JWT authentication tokens to backend requests. |
| **Lucide React** | Iconography | Clean, consistent, and lightweight SVGs. |

## Architecture & Route Groups

The application is structurally isolated using Next.js Route Groups (`(folderName)`) to cleanly separate public marketing layers from secure workspaces without messing up the URL structure.

- **`(public)`**: The landing page. Features a "Live Demo" widget that allows unauthenticated users a rate-limited glimpse of hybrid-quantum prediction.
- **`(auth)`**: The authentication flow. Handles secure JWT-based login, registration, password recovery, and OTP verification.
- **`(app)`**: The secure, authenticated "home" workspace. This is the core platform where users upload custom datasets, configure quantum kernels, execute parallel training, and view Quantum SHAP explainability visuals.

## Design Philosophy

**1. Visuals over complexity:** The primary goal of this UI is to translate dense, high-dimensional QML outputs into accessible, actionable insights for clinicians and evaluators. 
**2. Absolute separation of concerns:** The frontend **never** interacts with quantum hardware, simulators, or ML models directly. It is strictly a client that orchestrates tasks by communicating with the FastAPI backend.
**3. The "Real-Time" Illusion:** Quantum model training can be computationally expensive. The frontend is responsible for maintaining user trust during long-running tasks via optimistic UI updates, skeleton loaders, and clear progress indicators.

## Recommended Folder Structure

```
Frontend/
├── app/
│   ├── (public)/                 # Landing page and unauthenticated marketing
│   ├── (auth)/                   # Login, register, forgot-password
│   ├── (app)/                    # The main authenticated medical workspace
│   ├── globals.css               # Core Tailwind and theme variables
│   └── layout.tsx                # Root layout wrapper
├── components/
│   ├── auth/                     # Authentication form components
│   ├── landing/                  # Hero sections, limited demo widgets
│   ├── workspace/                # High-density data tables, quantum config panels
│   └── ui/                       # Base design system (shadcn/ui primitives)
├── lib/
│   ├── api.ts                    # Axios client configured with JWT interceptors
│   └── utils.ts                  # Tailwind merge utilities
├── public/                       # Static assets (images, raw SVGs)
└── package.json
```

## Setup & Execution

Refer to the root [`SETUP.md`](../SETUP.md) for full environment details.

```bash
cd Frontend
npm install
npm run dev
```
