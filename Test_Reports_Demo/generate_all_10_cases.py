import os
import json
import pandas as pd
import matplotlib.pyplot as plt

base_dir = r"c:\Users\anshu\OneDrive\Desktop\QuantumX\Test_Reports_Demo"
csv_path = os.path.join(base_dir, "Jury_Demo_Cohort_10_Cases.csv")

dirs = {
    "json": os.path.join(base_dir, "json"),
    "csv_tsv": os.path.join(base_dir, "csv_tsv"),
    "pdf": os.path.join(base_dir, "pdf"),
    "image": os.path.join(base_dir, "image"),
    "text": os.path.join(base_dir, "text"),
    "md": os.path.join(base_dir, "md")
}

for d in dirs.values():
    os.makedirs(d, exist_ok=True)

df = pd.read_csv(csv_path)

for idx, row in df.iterrows():
    case_num = idx + 1
    p_id = str(row["patient_id"]).strip()
    name = str(row["patient_name"]).strip()
    safe_name = name.replace(" ", "_")
    prefix = f"Case_{case_num:02d}_{p_id}_{safe_name}"
    
    age = int(row["age"])
    gender = "Female"
    accession = f"ACC-2026-08{case_num:02d}"
    date = f"2026-08-{13 + case_num:02d}" if case_num <= 18 else "2026-08-30"
    specimen = "Fine Needle Aspiration Biopsy (Right/Left Breast Lesion)"
    
    biomarkers = {
        "radius_mean": float(row["radius_mean"]),
        "texture_mean": float(row["texture_mean"]),
        "perimeter_mean": float(row["perimeter_mean"]),
        "area_mean": float(row["area_mean"]),
        "smoothness_mean": float(row["smoothness_mean"]),
        "compactness_mean": float(row["compactness_mean"]),
        "concavity_mean": float(row["concavity_mean"]),
        "concave_points_mean": float(row["concave_points_mean"])
    }
    
    gt = str(row["ground_truth"]).strip()
    is_mal = "Malignant" in gt
    notes = str(row["clinical_notes"]).strip()
    impression = f"Malignant ({gt} Infiltrating Carcinoma)" if is_mal else f"Benign ({gt} Non-neoplastic lesion)"
    
    # 1. JSON
    json_data = {
        "patient_id": p_id,
        "patient_name": name,
        "age": age,
        "gender": gender,
        "accession_number": accession,
        "collection_date": date,
        "specimen_type": specimen,
        "biomarkers": biomarkers,
        "pathologist_findings": {
            "clinical_impression": impression,
            "ground_truth": gt,
            "notes": notes,
            "signed_by": "Dr. Marcus Vance, MD, FCAP (Chief of Cytopathology)",
            "institution": "ST. JUDE CYTOLOGY & ONCOLOGY LABORATORY"
        }
    }
    with open(os.path.join(dirs["json"], f"{prefix}.json"), "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)
        
    # 2. CSV & TSV
    flat_record = {
        "patient_id": p_id,
        "patient_name": name,
        "age": age,
        "gender": gender,
        "accession_number": accession,
        "collection_date": date,
        "specimen_type": specimen,
        **biomarkers,
        "ground_truth": gt,
        "clinical_impression": impression,
        "notes": notes,
        "signed_by": "Dr. Marcus Vance, MD, FCAP"
    }
    case_df = pd.DataFrame([flat_record])
    case_df.to_csv(os.path.join(dirs["csv_tsv"], f"{prefix}.csv"), index=False)
    case_df.to_csv(os.path.join(dirs["csv_tsv"], f"{prefix}.tsv"), sep="\t", index=False)
    
    # 3. TEXT
    txt_content = f"""================================================================================
ST. JUDE CYTOLOGY & ONCOLOGY LABORATORY
FINE NEEDLE ASPIRATION (FNA) CYTOPATHOLOGY REPORT
================================================================================
Patient ID:        {p_id}
Patient Name:      {name}
Age / Gender:      {age} Yrs / {gender}
Accession Number:  {accession}
Collection Date:   {date}
Specimen Type:     {specimen}

--------------------------------------------------------------------------------
AUTOMATED DIGITAL CYTOMETRY MEASUREMENTS:
--------------------------------------------------------------------------------
Cell Size (Radius Mean):         {biomarkers['radius_mean']:.2f} um
Surface Texture (Texture Mean):   {biomarkers['texture_mean']:.2f} std
Cell Perimeter (Perimeter Mean): {biomarkers['perimeter_mean']:.2f} um
Nuclear Area (Area Mean):        {biomarkers['area_mean']:.1f} um2
Border Smoothness (Smoothness):  {biomarkers['smoothness_mean']:.4f} idx
Cell Compactness (Compactness):  {biomarkers['compactness_mean']:.4f} idx
Indentation Depth (Concavity):   {biomarkers['concavity_mean']:.4f} idx
Indentation Count (Points):      {biomarkers['concave_points_mean']:.4f} cnt

--------------------------------------------------------------------------------
PATHOLOGIST FINDINGS & DIAGNOSTIC IMPRESSION:
--------------------------------------------------------------------------------
Clinical Impression: {impression}
Notes: {notes}

Signed by: Dr. Marcus Vance, MD, FCAP (Chief of Cytopathology)
================================================================================
"""
    with open(os.path.join(dirs["text"], f"{prefix}.txt"), "w", encoding="utf-8") as f:
        f.write(txt_content)
        
    # 4. MARKDOWN
    md_content = f"""# 🏥 ST. JUDE CYTOLOGY & ONCOLOGY LABORATORY
## Fine Needle Aspiration (FNA) Cytopathology Report

---

### 👤 Patient Demographics & Intake
* **Patient ID:** `{p_id}`
* **Patient Name:** {name}
* **Age / Gender:** {age} Yrs / {gender}
* **Accession Number:** `{accession}`
* **Collection Date:** {date}
* **Specimen Type:** {specimen}

---

### 🔬 Automated Digital Cytometry Biomarkers

| Parameter | Measured Value | Standard Unit | Reference Normal Range |
|---|:---:|:---:|:---:|
| **Cell Size (Radius Mean)** | `{biomarkers['radius_mean']:.2f}` | μm | 10.0 - 14.5 μm |
| **Surface Texture (Texture Mean)** | `{biomarkers['texture_mean']:.2f}` | std | 10.0 - 15.0 std |
| **Cell Perimeter (Perimeter Mean)** | `{biomarkers['perimeter_mean']:.2f}` | μm | 60.0 - 90.0 μm |
| **Nuclear Area (Area Mean)** | `{biomarkers['area_mean']:.1f}` | μm² | 300.0 - 650.0 μm² |
| **Border Smoothness (Smoothness)** | `{biomarkers['smoothness_mean']:.4f}` | idx | 0.060 - 0.100 idx |
| **Cell Compactness (Compactness)** | `{biomarkers['compactness_mean']:.4f}` | idx | 0.030 - 0.080 idx |
| **Indentation Depth (Concavity)** | `{biomarkers['concavity_mean']:.4f}` | idx | 0.010 - 0.050 idx |
| **Indentation Count (Points)** | `{biomarkers['concave_points_mean']:.4f}` | cnt | 0.010 - 0.040 cnt |

---

### 📋 Pathologist Findings & Impression
* **Clinical Impression:** {'🔴 **' if is_mal else '🟢 **'}{impression}**
* **Cytological Notes:** {notes}
* **Attending Pathologist:** Dr. Marcus Vance, MD, FCAP (Chief of Cytopathology)
"""
    with open(os.path.join(dirs["md"], f"{prefix}.md"), "w", encoding="utf-8") as f:
        f.write(md_content)
        
    # 5. High-Res PDF and PNG Image Document
    fig, ax = plt.subplots(figsize=(8.5, 11), dpi=200)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#ffffff")
    ax.axis("off")

    # Header Banner
    rect = plt.Rectangle((0.04, 0.88), 0.92, 0.08, facecolor="#0f172a", edgecolor="none", transform=ax.transAxes)
    ax.add_patch(rect)
    ax.text(0.06, 0.93, "ST. JUDE CYTOLOGY & ONCOLOGY LABORATORY", color="#ffffff", fontsize=13, fontweight="bold", transform=ax.transAxes)
    ax.text(0.06, 0.895, "DEPARTMENT OF CLINICAL PATHOLOGY | FINE NEEDLE ASPIRATION (FNA) REPORT", color="#94a3b8", fontsize=8, fontweight="medium", transform=ax.transAxes)

    # Patient Info Box
    p_box = plt.Rectangle((0.04, 0.73), 0.92, 0.13, facecolor="#f8fafc", edgecolor="#cbd5e1", linewidth=1, transform=ax.transAxes)
    ax.add_patch(p_box)
    ax.text(0.06, 0.83, "PATIENT DEMOGRAPHICS & INTAKE", color="#0f172a", fontsize=9, fontweight="bold", transform=ax.transAxes)

    ax.text(0.06, 0.79, f"Patient Name: {name}", color="#1e293b", fontsize=8.5, transform=ax.transAxes)
    ax.text(0.06, 0.75, f"Patient ID:   {p_id}", color="#1e293b", fontsize=8.5, fontweight="bold", transform=ax.transAxes)

    ax.text(0.40, 0.79, f"Age / Gender: {age} Yrs / {gender}", color="#1e293b", fontsize=8.5, transform=ax.transAxes)
    ax.text(0.40, 0.75, f"Accession #:  {accession}", color="#1e293b", fontsize=8.5, transform=ax.transAxes)

    ax.text(0.70, 0.79, f"Date: {date}", color="#1e293b", fontsize=8.5, transform=ax.transAxes)
    ax.text(0.70, 0.75, "Status: Final Diagnostic", color="#059669", fontsize=8.5, fontweight="bold", transform=ax.transAxes)

    # Biomarkers Table
    ax.text(0.06, 0.69, "AUTOMATED DIGITAL CYTOMETRY MEASUREMENTS", color="#0f172a", fontsize=9, fontweight="bold", transform=ax.transAxes)

    table_data = [
        ["Cell Size (Radius Mean)", f"{biomarkers['radius_mean']:.2f}", "um", "10.0 - 14.5 um", "HIGH RISK" if biomarkers['radius_mean'] > 14.5 else "NORMAL"],
        ["Surface Texture (Texture Mean)", f"{biomarkers['texture_mean']:.2f}", "std", "10.0 - 15.0 std", "ELEVATED" if biomarkers['texture_mean'] > 15.0 else "NORMAL"],
        ["Cell Perimeter (Perimeter Mean)", f"{biomarkers['perimeter_mean']:.2f}", "um", "60.0 - 90.0 um", "HIGH RISK" if biomarkers['perimeter_mean'] > 90.0 else "NORMAL"],
        ["Nuclear Area (Area Mean)", f"{biomarkers['area_mean']:.1f}", "um2", "300.0 - 650.0 um2", "HIGH RISK" if biomarkers['area_mean'] > 650.0 else "NORMAL"],
        ["Border Smoothness (Smoothness)", f"{biomarkers['smoothness_mean']:.4f}", "idx", "0.060 - 0.100 idx", "NORMAL" if biomarkers['smoothness_mean'] <= 0.100 else "ELEVATED"],
        ["Cell Compactness (Compactness)", f"{biomarkers['compactness_mean']:.4f}", "idx", "0.030 - 0.080 idx", "BORDERLINE" if biomarkers['compactness_mean'] > 0.080 else "NORMAL"],
        ["Indentation Depth (Concavity)", f"{biomarkers['concavity_mean']:.4f}", "idx", "0.010 - 0.050 idx", "ELEVATED" if biomarkers['concavity_mean'] > 0.050 else "NORMAL"],
        ["Indentation Count (Points)", f"{biomarkers['concave_points_mean']:.4f}", "cnt", "0.010 - 0.040 cnt", "HIGH RISK" if biomarkers['concave_points_mean'] > 0.040 else "NORMAL"],
    ]

    col_labels = ["Biomarker Parameter", "Value", "Unit", "Reference Range", "Clinical Flag"]
    table = ax.table(cellText=table_data, colLabels=col_labels, loc="center", bbox=[0.04, 0.33, 0.92, 0.34])
    table.auto_set_font_size(False)
    table.set_fontsize(8)

    for (r_idx, c_idx), cell in table.get_celld().items():
        cell.set_edgecolor("#e2e8f0")
        if r_idx == 0:
            cell.set_facecolor("#0f172a")
            cell.set_text_props(color="#ffffff", weight="bold")
        else:
            if c_idx == 4:
                txt = table_data[r_idx-1][4]
                if "HIGH" in txt:
                    cell.set_facecolor("#fef2f2")
                    cell.set_text_props(color="#dc2626", weight="bold")
                elif "ELEVATED" in txt or "BORDERLINE" in txt:
                    cell.set_facecolor("#fffbeb")
                    cell.set_text_props(color="#d97706", weight="bold")
                else:
                    cell.set_facecolor("#f0fdf4")
                    cell.set_text_props(color="#16a34a", weight="medium")
            else:
                cell.set_facecolor("#ffffff" if r_idx % 2 == 1 else "#f8fafc")

    # Impression Box
    bg_color = "#fef2f2" if is_mal else "#f0fdf4"
    border_color = "#fca5a5" if is_mal else "#86efac"
    title_color = "#991b1b" if is_mal else "#166534"
    text_color = "#7f1d1d" if is_mal else "#14532d"

    imp_box = plt.Rectangle((0.04, 0.14), 0.92, 0.16, facecolor=bg_color, edgecolor=border_color, linewidth=1, transform=ax.transAxes)
    ax.add_patch(imp_box)
    ax.text(0.06, 0.27, "PATHOLOGIST DIAGNOSTIC IMPRESSION", color=title_color, fontsize=9, fontweight="bold", transform=ax.transAxes)
    ax.text(0.06, 0.235, f"Clinical Impression: {impression}", color=text_color, fontsize=8.5, fontweight="bold", transform=ax.transAxes)
    ax.text(0.06, 0.18, f"Cytological Notes: {notes}", color=text_color, fontsize=7.8, transform=ax.transAxes)
    ax.text(0.06, 0.15, "Signed: Dr. Marcus Vance, MD, FCAP (Chief of Cytopathology)", color=title_color, fontsize=8, fontweight="medium", transform=ax.transAxes)

    # Footer
    ax.text(0.04, 0.05, "QuantumX Verified Clinical Ingestion Benchmark Document", color="#94a3b8", fontsize=7, transform=ax.transAxes)

    # Save PDF & PNG
    pdf_path = os.path.join(dirs["pdf"], f"{prefix}.pdf")
    png_path = os.path.join(dirs["image"], f"{prefix}.png")

    plt.savefig(pdf_path, format="pdf", bbox_inches="tight", dpi=200)
    plt.savefig(png_path, format="png", bbox_inches="tight", dpi=200)
    plt.close()

    print(f"Generated all formats for Case {case_num:02d}: {name}")

print("\nAll 10 cases populated across json/, csv_tsv/, text/, md/, pdf/, and image/ folders!")
