# 📋 SIH26139 Live Jury Demonstration: 10 Unseen Test Patient Reports

This folder contains **10 held-out, realistic clinical pathology lab reports** designed specifically for your live demonstration in front of SIH judges.

---

## 🎯 Quick Reference Cheat Sheet (For the Presenter)

| Report ID | Patient Name | Key Clinical Indicator | Ground Truth | Expected Quantum Consensus |
|:---:|:---|---|:---:|:---:|
| **Case 01** | `Patient-BC-101` (Elena Vance, 54) | Enlarged nucleus ($20.57\,\mu\text{m}$), high area ($1326\,\mu\text{m}^2$) | 🔴 **Malignant** | **High Risk ($\ge 95\%$)** |
| **Case 02** | `Patient-BC-102` (Sarah Jenkins, 42) | Small uniform cells ($11.42\,\mu\text{m}$), smooth boundaries | 🟢 **Benign** | **Low Risk ($\ge 94\%$)** |
| **Case 03** | `Patient-BC-103` (Priya Sharma, 49) | Borderline density ($13.54\,\mu\text{m}$), low concavity | 🟢 **Benign** | **Low Risk ($\ge 91\%$)** |
| **Case 04** | `Patient-BC-104` (Rachel Adams, 61) | Moderate radius ($16.13\,\mu\text{m}$), high notch count ($0.077$) | 🔴 **Malignant** | **High Risk ($\ge 93\%$)** |
| **Case 05** | `Patient-BC-105` (Mei Lin, 38) | Compact simple cyst ($9.50\,\mu\text{m}$), smooth contour | 🟢 **Benign** | **Low Risk ($\ge 98\%$)** |
| **Case 06** | `Patient-BC-106` (Clara Oswald, 68) | Severe enlargement ($23.21\,\mu\text{m}$), irregular indentations | 🔴 **Malignant** | **High Risk ($\ge 99\%$)** |
| **Case 07** | `Patient-BC-107` (Ananya Gupta, 45) | Sclerosing adenosis ($12.89\,\mu\text{m}$), very low roughness | 🟢 **Benign** | **Low Risk ($\ge 96\%$)** |
| **Case 08** | `Patient-BC-108` (Deborah Vance, 58) | High roughness ($21.25$), deep indentations ($0.197$) | 🔴 **Malignant** | **High Risk ($\ge 97\%$)** |
| **Case 09** | `Patient-BC-109` (Fatima Al-Sayed, 50) | Atypical hyperplasia ($13.03\,\mu\text{m}$), low concavity | 🟢 **Benign** | **Low Risk ($\ge 93\%$)** |
| **Case 10** | `Patient-BC-110` (Victoria Sterling, 64)| High compactness ($0.237$), multiple concave notches ($0.152$)| 🔴 **Malignant** | **High Risk ($\ge 98\%$)** |

---

## 💡 How to Demo in Front of the Judges:

1. **Option A (Automated Upload Demo):**
   - Click the **"Upload Report"** button in the Breast Cancer Studio.
   - Upload any of the individual `.txt` files or the `Jury_Demo_Cohort_10_Cases.csv`.
   - Watch the platform automatically extract and tag every cellular biomarker in real time.

2. **Option B (Interactive Missing Value / Derivation Demo):**
   - Pick **Case 01** or **Case 04**.
   - Clear the "Cell Size (Radius)" field and click **"Don't have this?"**.
   - Show the judges how the engine calculates $r = \sqrt{A/\pi}$ directly from Nuclear Area ($1326\,\mu\text{m}^2 \to 20.54\,\mu\text{m}$).

3. **Option C (Live Screening & Quantum Explainability):**
   - Click **"Run Quantum vs Classical Screening"**.
   - Show the judges:
     1. The **Dual Consensus** (Quantum Model + Classical Baseline).
     2. The **QXplain Gate Saliency Breakdown** proving exactly which cellular factor caused the cancer prediction.
     3. Download the generated Clinical Summary Report.
