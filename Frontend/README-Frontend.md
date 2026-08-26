<div align="center">

# QuantumX Frontend

[![Status](https://img.shields.io/badge/status-active%20development-yellow)]()
[![SIH](https://img.shields.io/badge/SIH%202026-SIH26139-blue)]()
[![Python](https://img.shields.io/badge/backend-Python%203.12%2B-3776AB?logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/frontend-Next.js%2016-black?logo=next.js&logoColor=white)]()
[![Qiskit](https://img.shields.io/badge/quantum-Qiskit%20%7C%20PennyLane-6929C4)]()
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../LICENSE)

</div>

This is the Next.js (App Router) frontend for the QuantumX platform. 
It serves as the UI layer for the Hybrid Quantum Machine Learning Pipeline, providing a dashboard for biomedical data ingestion, hybrid training execution, and visualization of predictions and explainability metrics.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Data Visualization:** Recharts
- **HTTP Client:** Axios

## Conventions & Rules
- **No direct quantum interactions:** The frontend strictly communicates with the FastAPI backend. It never talks directly to quantum hardware or simulators.
- **Visuals over complexity:** The primary goal of the UI is to present dense, high-dimensional QML benchmarking and explainability data in an accessible way for clinicians and judges.
- **Component placement:** Reusable UI elements go into `components/`. Pages are constructed in the `app/` router directory.

## Setup
Refer to the root [`SETUP.md`](../SETUP.md) for full environment details.
```bash
npm install
npm run dev
```
