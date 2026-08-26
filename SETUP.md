# Setup Guide

Follow these steps to set up the QuantumX development environment.

## 1. Prerequisites
- **Python:** 3.12 or newer.
- **Node.js:** 18 or newer (with npm or yarn).

## 2. Backend Setup
The backend uses Python and FastAPI, with Qiskit and PennyLane for Quantum Machine Learning.

1. Navigate to the Backend folder:
   ```bash
   cd Backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies (once `requirements.txt` is created):
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the `.env.example` file to `.env` and fill in your secrets (e.g., IBM Quantum API token).
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## 3. Frontend Setup
The frontend uses Next.js (App Router).

1. Navigate to the Frontend folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 4. Quantum Hardware Access
To run the benchmarking on real quantum hardware:
1. Sign up for an IBM Quantum account at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).
2. Get your API token and save it to the `.env` file in the Backend.
3. Use the Qiskit Runtime to dispatch jobs to the real QPUs. Development should default to `qiskit_aer` or `default.qubit` to avoid queue times.
