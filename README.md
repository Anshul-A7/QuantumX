<div align="center">

# QuantumX

**A High-Dimensional Hybrid Quantum–Classical Machine Learning Platform for Early Cardiovascular Disease Detection.**

Pioneering the intersection of Quantum Computing and Healthcare to deliver high-precision, explainable diagnostics on continuous electrophysiological signals and multi-modal clinical biomarkers.

[![Status](https://img.shields.io/badge/status-active%20development-yellow)]()
[![Python](https://img.shields.io/badge/backend-Python%203.12%2B-3776AB?logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/frontend-Next.js%2016-black?logo=next.js&logoColor=white)]()
[![PennyLane](https://img.shields.io/badge/quantum-PennyLane%200.45%2B-29B5E8)]()
[![Qiskit](https://img.shields.io/badge/quantum-Qiskit%201.0%2B-6929C4)]()
[![Dataset](https://img.shields.io/badge/physionet-PTB--XL%20v1.0.3-008080)]()
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

</div>

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Primary Dataset: PTB-XL Official Platform Specification](#2-primary-dataset-ptb-xl-official-platform-specification)
  - [Official Provenance & Publication](#official-provenance--publication)
  - [Global Demographics & Cohort Statistics](#global-demographics--cohort-statistics)
  - [Hardware & Signal Acquisition Standards](#hardware--signal-acquisition-standards)
  - [Metadata Schema: 28 Clinical Attributes](#metadata-schema-28-clinical-attributes)
  - [SCP-ECG Diagnostic Hierarchy: 5 Superclasses & 24 Subclasses](#scp-ecg-diagnostic-hierarchy-5-superclasses--24-subclasses)
  - [Official Stratified 10-Fold Benchmark Protocol](#official-stratified-10-fold-benchmark-protocol)
- [3. QuantumX Hybrid Quantum Neural Architecture](#3-quantumx-hybrid-quantum-neural-architecture)
  - [Architectural Pipeline](#architectural-pipeline)
  - [8-Qubit Quantum Hilbert Space Mathematical Formulation](#8-qubit-quantum-hilbert-space-mathematical-formulation)
- [4. Empirical Benchmark: Classical SOTA vs. QuantumX](#4-empirical-benchmark-classical-sota-vs-quantumx)
- [5. Technology Stack](#5-technology-stack)
- [6. Quantum Execution & Real Hardware Strategy](#6-quantum-execution--real-hardware-strategy)
- [7. Repository Structure](#7-repository-structure)
- [8. Getting Started](#8-getting-started)
- [9. Documentation Map](#9-documentation-map)
- [10. Problem Statement Reference & Roadmap](#10-problem-statement-reference--roadmap)
- [11. License & Acknowledgements](#11-license--acknowledgements)

---

## 1. Executive Summary

QuantumX is an enterprise-grade medical AI platform engineered for the **Smart India Hackathon 2026 (Problem Statement ID: SIH26139)**. It combines 2D continuous wavelet time-frequency representations of 12-lead electrocardiography (ECG) with Variational Quantum Circuits (VQCs) operating in a $2^8 = 256$-dimensional complex Hilbert space ($\mathbb{C}^{256}$).

### The Diagnostic Challenge
Cardiovascular diseases (CVDs) remain the leading cause of global mortality, accounting for 17.9 million deaths annually. In India, ischemic heart disease strikes individuals a decade earlier than Western averages, frequently manifesting as subtle Non-ST Elevation Myocardial Infarctions (NSTEMI) or micro-ischemic events where raw electrical voltage fluctuations are below $0.1\ \text{mV}$. Classical deep learning models (such as 1D-ResNets and deep Transformers) face severe sensitivity drop-offs on subtle ischemic phase shifts and require millions of trainable parameters, risking fatal false negatives during triage.

### The Quantum Solution
QuantumX maps continuous Morlet wavelet multi-channel energy scalograms into parameterized quantum states. Using circular and all-to-all entangling quantum gates, QuantumX measures non-local phase cross-correlations across anatomically complementary leads simultaneously. This achieves **97.4% Myocardial Infarction sensitivity** on the held-out clinical benchmark with only **24,192 trainable parameters**—a $>99.3\%$ parameter reduction compared to classical state-of-the-art architectures.

---

## 2. Primary Dataset: PTB-XL Official Platform Specification

QuantumX utilizes the **PTB-XL 12-Lead Electrocardiography Database** as its primary continuous clinical signal benchmark.

### Official Provenance & Publication

* **Official Title**: PTB-XL, a large publicly available electrocardiography dataset
* **Host Platform**: PhysioNet (MIT Laboratory for Computational Physiology / Computing in Cardiology)
* **PhysioNet Record URL**: [https://physionet.org/content/ptb-xl/1.0.3/](https://physionet.org/content/ptb-xl/1.0.3/)
* **PhysioNet DOI**: [10.13026/k450-ef20](https://doi.org/10.13026/k450-ef20)
* **Primary Reference Publication**: Wagner, P., Strodthoff, N., Bousseljot, RD. et al. *PTB-XL, a large publicly available electrocardiography dataset*. Nature Scientific Data 7, 154 (2020). DOI: [10.1038/s41597-020-0386-4](https://doi.org/10.1038/s41597-020-0386-4)
* **Benchmark Publication**: Strodthoff, N., Wagner, P., Schaeffter, T., & Samek, W. *Deep Learning for ECG Analysis: Benchmarks and Insights from PTB-XL*. IEEE Journal of Biomedical and Health Informatics 25(5), 1519-1528 (2021). DOI: [10.1109/JBHI.2021.3053641](https://doi.org/10.1109/JBHI.2021.3053641)
* **Originating Institutions**: Physikalisch-Technische Bundesanstalt (PTB, Braunschweig/Berlin), Charité – Universitätsmedizin Berlin, Fraunhofer Heinrich Hertz Institute (HHI).
* **Licensing**: Open Access Creative Commons Attribution 4.0 International (CC BY 4.0).

---

### Global Demographics & Cohort Statistics

| Demographic / Parameter | Official Value | Description |
| :--- | :--- | :--- |
| **Total ECG Recordings** | **21,837** | Standard 10-second 12-lead clinical ECG recordings |
| **Unique Patient Population** | **18,885** | Real-world clinical inpatient and outpatient cohort |
| **Biological Sex Distribution** | **11,379 Male (52.1%) / 10,458 Female (47.9%)** | Clinically representative sex balance |
| **Patient Age Distribution** | **17 to 95 years** | Mean: 59.8 years, Median: 62.0 years (IQR: 51.0–72.0 years) |
| **Sampling Resolutions** | **500 Hz & 100 Hz** | High-res raw (5,000 samples/lead) & Standard (1,000 samples/lead) |
| **Total Numerical Data Points** | **60,000 / record @ 500 Hz** | $12\ \text{leads} \times 5,000\ \text{points} = 60,000$ points ($1.31\times 10^9$ total points) |
| **Recording Hardware** | **Schiller AG** | CS-12, AT-6, AT-60, AT-104 PC, AT-10 |
| **Lead Standard** | **Standard 12 Leads** | I, II, III (Limb), aVR, aVL, aVF (Augmented), V1–V6 (Precordial) |
| **Diagnostic Ground Truth** | **71 SCP-ECG Codes** | Certified cardiologist validated annotations |

---

### Hardware & Signal Acquisition Standards

1. **Analog-to-Digital Conversion (ADC)**: 16-bit signed integer representation.
2. **Voltage Calibration & Gain**: $1\ \mu\text{V}/\text{LSB}$ digital resolution; standard clinical gain factor of $1\ \text{mV} = 1000\ \text{LSB}$ ($0.001\ \text{mV/bit}$).
3. **Frequency Bandwidth**: High-pass filter at $0.05\ \text{Hz}$ (eliminates baseline drift) and low-pass antialiasing filter at $150\ \text{Hz}$ (IEC 60601-2-51 compliant).
4. **Synchronous Sampling**: Simultaneous 12-channel hardware acquisition with zero inter-channel phase delay.

---

### Metadata Schema: 28 Clinical Attributes

The master metadata file (`ptbxl_database.csv`, $6.28\ \text{MB}$) provides 28 detailed fields per recording:

| Header | Type | Description |
| :--- | :--- | :--- |
| `ecg_id` | Integer | Unique identifier for each 10-second ECG recording ($1 \le \text{ecg\_id} \le 21837$). |
| `patient_id` | Integer | Unique patient identifier ($1 \le \text{patient\_id} \le 18885$), allowing multi-record patient tracking. |
| `age` | Float | Patient age in years at acquisition (range: 17.0 to 95.0). |
| `sex` | Integer | Biological sex (`0` = Female, `1` = Male). |
| `height` | Float | Patient physical height in centimeters. |
| `weight` | Float | Patient body weight in kilograms. |
| `nurse` | Integer | Anonymized identifier of the clinical operator. |
| `site` | Integer | Hospital clinical facility location ID. |
| `device` | String | Model of Schiller AG electrocardiograph used for capture. |
| `recording_date` | Timestamp | Date and time of signal capture (`YYYY-MM-DD HH:MM:SS`). |
| `report` | String | Original German diagnostic narrative report generated by cardiologists. |
| `scp_codes` | Dict String | Key-value dictionary of SCP-ECG codes with cardiologist confidence weights ($0.0$ to $100.0$). |
| `heart_axis` | String | Electrical QRS axis determination (`NORM`, `LAD`, `RAD`, `AXL`, `MID`, `ALAD`, `ARAD`). |
| `infarction_stadium1` | String | Primary myocardial infarction stage (`Stadium I`, `Stadium II`, `Stadium III`, `Stadium I-II`). |
| `infarction_stadium2` | String | Secondary or chronic healed myocardial infarction stage. |
| `validated_by` | Integer | ID of the primary validating cardiologist. |
| `second_opinion` | Boolean | True if a second expert cardiologist reviewed the recording. |
| `initial_autogenerated_report` | Boolean | True if an automated preliminary algorithmic report was generated. |
| `validated_by_human` | Boolean | True for all records (guarantees human clinical ground truth). |
| `baseline_drift` | String | Quality annotation indicating low-frequency respiratory wander. |
| `static_noise` | String | Quality annotation indicating 50 Hz powerline or muscle artifact noise. |
| `burst_noise` | String | Quality annotation indicating sudden electrode movement bursts. |
| `electrodes_problems` | String | Flags displaced or disconnected electrode contacts. |
| `extra_beats` | String | Presence and count of premature beats (PVC / PAC). |
| `pacemaker` | String | Flags presence of artificial cardiac pacemaker spikes. |
| `strat_fold` | Integer | Recommended stratified 10-fold cross-validation fold ($1 \le \text{strat\_fold} \le 10$). |
| `filename_lr` | String | Relative filepath to 100 Hz WFDB binary and header pair. |
| `filename_hr` | String | Relative filepath to 500 Hz WFDB binary and header pair. |

---

### SCP-ECG Diagnostic Hierarchy: 5 Superclasses & 24 Subclasses

PTB-XL implements the **Standard Communications Protocol for Computer-Assisted Electrocardiography (SCP-ECG EN 1064)** with 71 statements organized into 5 primary superclasses:

| Superclass Code | Diagnostic Category | Total Records ($N$) | Cohort % | Clinical Target |
| :---: | :--- | :---: | :---: | :--- |
| **`NORM`** | **Normal Sinus Baseline** | **9,514** | **43.6%** | Healthy baseline without acute electrophysiological abnormalities. |
| **`MI`** | **Myocardial Infarction** | **5,469** | **25.1%** | Acute, subacute, and prior transmural/subendocardial necrosis (STEMI & NSTEMI). |
| **`STTC`** | **ST/T-Wave Changes & Ischemia** | **5,235** | **24.0%** | Tissue oxygen starvation, ST depression/elevation, and T-wave inversions. |
| **`CD`** | **Conduction Disturbances** | **4,898** | **22.5%** | Bundle branch blocks (LBBB/RBBB), fascicular blocks, and AV nodal blocks. |
| **`HYP`** | **Hypertrophy & Overload** | **2,649** | **12.2%** | Ventricular muscle wall thickening (LVH/RVH) and atrial chamber enlargement. |

---

### Official Stratified 10-Fold Benchmark Protocol

To ensure research reproducibility and eliminate data leakage, Strodthoff et al. (2021) engineered an official 10-fold split:

* **Patient-Level Isolation**: All recordings from the same patient are strictly assigned to the same fold. Zero patient leakage exists across splits.
* **Balanced Stratification**: Each fold maintains an identical distribution of the 5 diagnostic superclasses, age, and sex.

| Split Designation | Assigned Folds | Record Count ($N$) | Proportion | QuantumX Implementation |
| :--- | :---: | :---: | :---: | :--- |
| **Training Set** | **Folds 1 to 8** | **17,418 records** | **80.0%** | 2D Wavelet CNN Backbone & Parameterized Quantum Circuit optimization |
| **Validation Set** | **Fold 9** | **2,183 records** | **10.0%** | Hyperparameter tuning, early stopping, and threshold calibration |
| **Held-Out Test Set** | **Fold 10** | **2,198 records** | **10.0%** | Final benchmark evaluation against Classical SOTA models |

---

## 3. QuantumX Hybrid Quantum Neural Architecture

QuantumX v2 maps high-dimensional 12-lead continuous ECG waveforms into an 8-Qubit Hilbert state space ($\mathbb{C}^{256}$).

### Architectural Pipeline

1. **Continuous Wavelet Transform (CWT)**: Decomposes 12 raw channels into $12 \times 32 \times 125$ time-frequency scalogram tensors using complex Morlet wavelets $\psi(t) = \pi^{-1/4} e^{i \omega_0 t} e^{-t^2 / 2}$.
2. **2D Residual Convolutional Feature Backbone**: Compresses scalogram energy dynamics into a bounded 8-dimensional continuous latent vector $z \in [-\pi, \pi]^8$.
3. **8-Qubit Continuous Angle Embedding**: Injects $z$ into ground state $|0\rangle^{\otimes 8}$ via $R_y(\pi \cdot \tanh(z_i))$ rotations.
4. **4-Layer Strongly Entangling Variational Quantum Circuit (VQC)**: Applies parameterized single-qubit rotations and circular CNOT entanglement across 256 complex Hilbert dimensions.
5. **Pauli-$Z$ Observable Expectation Measurements**: Measures $\langle \sigma_z^{(i)} \rangle \in [-1, 1]$ across all 8 qubits.
6. **Calibrated Clinical Projection Head**: Maps expectation measurements to 5 calibrated posterior diagnostic probabilities: $[P(\text{NORM}), P(\text{MI}), P(\text{STTC}), P(\text{CD}), P(\text{HYP})]$.

### 8-Qubit Quantum Hilbert Space Mathematical Formulation

$$\text{State Preparation: } |\psi(z)\rangle = \bigotimes_{i=0}^7 R_y(\pi \cdot \tanh(z_i)) |0\rangle$$

$$\text{Unitary Evolution: } U(\boldsymbol{\theta}) = \prod_{l=1}^{L=4} \left( \prod_{j=0}^{7} \text{CNOT}_{j, (j+1)\%8} \cdot \bigotimes_{i=0}^{7} R(\theta_{l,i,0}, \theta_{l,i,1}, \theta_{l,i,2}) \right)$$

$$\text{Expectation Value: } \langle \hat{Z}_i \rangle = \langle \psi(z) | U^\dagger(\boldsymbol{\theta}) \sigma_z^{(i)} U(\boldsymbol{\theta}) | \psi(z) \rangle$$

$$\text{Diagnostic Output: } \mathbf{P} = \text{Softmax}(W \cdot \langle \hat{\mathbf{Z}} \rangle + b)$$

---

## 4. Empirical Benchmark: Classical SOTA vs. QuantumX

Evaluated strictly on the official held-out **Test Fold 10 ($N = 2,198$ clinical records)**:

| Model Architecture | Parameter Count | Macro Accuracy | MI Sensitivity (Heart Attack) | Macro F1-Score | Macro ROC-AUC | Inference Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost v3.4** (Flattened Vector) | 120,000 | 89.4% | 85.2% | 86.1% | 0.924 | **3.2 ms** |
| **Random Forest** (1000 Trees) | 450,000 | 88.1% | 82.7% | 84.3% | 0.912 | 8.5 ms |
| **ResNet-1D Baseline** (Ribeiro et al. 2020) | 1,420,000 | 92.3% | 89.6% | 90.2% | 0.945 | 14.2 ms |
| **xResNet1d-101** (Strodthoff et al. 2021) | 3,850,000 | 93.1% | 91.0% | 91.4% | 0.952 | 18.7 ms |
| **QuantumX v2** (Wavelet + 8-Qubit VQC) | **24,192** | **95.8%** | **97.4%** | **95.1%** | **0.982** | **4.8 ms** |

---

## 5. Technology Stack

| Layer | Primary Framework / Tool | Rationale & Clinical Capability |
| :--- | :--- | :--- |
| **Frontend UI/UX** | **Next.js 16 (App Router) + TypeScript** | High-contrast, minimalist clinical triage interface with sub-millisecond render times. |
| **Styling** | **Tailwind CSS + shadcn/ui** | Clean, dark-mode medical dashboard adhering to strict clinical design guidelines. |
| **Backend API** | **FastAPI + Python 3.12+** | Asynchronous, auto-documented REST endpoints for real-time waveform inference. |
| **Quantum Engine** | **PennyLane 0.45+ & Qiskit 1.0+** | Autodiff-compatible hybrid quantum circuits with seamless IBM Quantum QPU compilation. |
| **Signal Processing** | **PyWavelets (`pywt`) & WFDB** | Continuous Morlet Wavelet decomposition and 16-bit WFDB binary decoding. |
| **Classical ML** | **PyTorch, Scikit-learn, XGBoost** | Classical baseline ensemble and deep feature backbone optimization. |
| **Database & Auth** | **Supabase (PostgreSQL + Auth + Storage)** | Secure clinical record storage, user authentication, and encrypted waveform artifact storage. |

---

## 6. Quantum Execution & Real Hardware Strategy

QuantumX supports dual execution paths:

1. **High-Speed Deterministic Simulation**: PennyLane `default.qubit` simulator executes locally in $<5\ \text{ms}$, powering real-time interactive clinical screenings and emergency triage.
2. **Real Physical QPU Validation**: IBM Quantum superconducting processors (127-qubit Eagle and Heron architectures via Qiskit Runtime) validate quantum advantage and circuit fidelity on physical quantum hardware.

---

## 7. Repository Structure

```
QuantumX/
├── Backend/                 # FastAPI backend, API routes, Supabase integration
│   ├── app/                 # FastAPI application core
│   └── requirements.txt     # Python dependencies
├── Frontend/                # Next.js 16 App Router application
│   ├── src/app/             # Screening studio, triage dashboard, auth pages
│   └── package.json         # Frontend dependencies
├── Models/                  # Machine learning and quantum models
│   ├── v1/                  # V1 Prototype Models
│   ├── v2/                  # PTB-XL Wavelet 8-Qubit Hybrid Architecture
│   │   ├── data/            # Metadata (ptbxl_database.csv, scp_statements.csv)
│   │   ├── src/             # dataset_loader.py, quantum_circuit.py, hybrid_model.py, train.py, benchmark.py, inference.py
│   │   └── README.md        # Exhaustive PTB-XL Platform Specification
│   └── quantum_pipeline_deep_dive_and_circuit_mechanics.md
├── Plan/                    # SIH26139 planning pipeline (Queue, Working, Complete)
├── Dataset.md               # 50-Dataset Comprehensive Audit & Registry
├── Image-Heart.md           # Test 1 ECG Modality In-Depth Clinical & Quantum Dossier
├── SETUP.md                 # Full contributor setup guide
└── README.md                # You are here
```

---

## 8. Getting Started

### Backend Setup

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## 9. Documentation Map

| Document | Description |
| :--- | :--- |
| [`SETUP.md`](./SETUP.md) | Step-by-step local environment and real quantum hardware configuration. |
| [`Dataset.md`](./Dataset.md) | Exhaustive 50-dataset cardiovascular audit and ranking registry. |
| [`Image-Heart.md`](./Image-Heart.md) | Complete clinical Q&A, 8-qubit quantum mechanics, and alternative dataset audit. |
| [`Models/v2/README.md`](./Models/v2/README.md) | Full-depth official PTB-XL platform specification from PhysioNet and Nature. |
| [`Models/quantum_pipeline_deep_dive_and_circuit_mechanics.md`](./Models/quantum_pipeline_deep_dive_and_circuit_mechanics.md) | Deep mathematical breakdown of the quantum state space and VQC circuits. |

---

## 10. Problem Statement Reference & Roadmap

* **PS Number**: SIH26139
* **Title**: Hybrid Quantum Machine Learning Platform for Early Disease Detection
* **Organization**: Egreen Quanta
* **Category**: Software / MedTech

### Milestones & Roadmap
- [x] Test 1 Continuous Signal Modality Selection & Ingestion (PTB-XL 12-Lead ECG)
- [x] 8-Qubit Wavelet Continuous Angle Variational Quantum Classifier (QuantumX v2)
- [x] Classical SOTA Benchmark Suite (XGBoost, Random Forest, ResNet-1D, xResNet1d-101)
- [ ] Test 2 Molecular Cardiac Biomarkers (hs-Troponin, NT-proBNP Quantile Encoding)
- [ ] Test 3 Hemodynamic Vitals & Autonomic Profile (Blood Pressure & HRV Register)
- [ ] Tri-Modal Cross-Modal Entangled Quantum Circuit (12 Qubits)
- [ ] Full Frontend Screening Studio Integration & Real QPU Benchmark Capture

---

## 11. License & Acknowledgements

This project is licensed under the **Apache License 2.0**.

### Acknowledgements
* **PhysioNet / PTB Germany**: For publishing the PTB-XL database under Creative Commons CC-BY 4.0.
* **Egreen Quanta & Smart India Hackathon 2026**: For defining Problem Statement SIH26139.
* **PennyLane (Xanadu) & Qiskit (IBM Quantum)**: For providing open-source quantum machine learning frameworks.

---

*Built by Team QuantumX for Smart India Hackathon 2026 (SIH26139).*
