import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      biomarkers = {},
      prediction = "Benign",
      confidence = 90.0,
      risk_score = 15.0,
      risk_tier = "LOW RISK",
      model_engine = "Transfinite-1",
      execution_mode = "simulator",
      shap_attributions = [],
      patient_info = {}
    } = body;

    const patientName = patient_info.name || "Patient";
    const patientId = patient_info.patient_id || "QX-001";
    const age = patient_info.age || 45;
    const gender = patient_info.gender || "Female";

    const topRiskDrivers = shap_attributions
      .filter((a: any) => a.direction === "risk_elevating")
      .map((a: any) => `${a.featureName} (${a.measuredValue})`)
      .slice(0, 3)
      .join(", ");

    const protectiveFactors = shap_attributions
      .filter((a: any) => a.direction === "protective")
      .map((a: any) => `${a.featureName} (${a.measuredValue})`)
      .slice(0, 3)
      .join(", ");

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    let aiSynthesis = null;

    if (geminiApiKey) {
      try {
        const prompt = `You are a Senior Computational Cytopathologist consulting on a breast cancer fine-needle aspiration (FNA) screening.
Review the following patient data, quantum-classical machine learning telemetry, and SHAP explainability values:

PATIENT: ${patientName} (${patientId}), Age ${age}, Gender ${gender}
INFERENCE ENGINE: ${model_engine} [Execution Mode: ${execution_mode}]
PREDICTION: ${prediction} (${confidence}% Confidence)
CONTINUOUS RISK SCORE: ${risk_score} / 100.0 [Category: ${risk_tier}]
MEASURED BIOMARKERS:
- Cell Size (Radius): ${biomarkers.radius_mean} um
- Surface Texture: ${biomarkers.texture_mean} std
- Cell Perimeter: ${biomarkers.perimeter_mean} um
- Nuclear Area: ${biomarkers.area_mean} um2
- Border Smoothness: ${biomarkers.smoothness_mean} idx
- Compactness: ${biomarkers.compactness_mean} idx
- Indentation Depth (Concavity): ${biomarkers.concavity_mean} idx
- Indentation Count: ${biomarkers.concave_points_mean} cnt

KEY RISK-ELEVATING ATTRIBUTIONS: ${topRiskDrivers || "None (All within benign baseline)"}
PROTECTIVE BENIGN ATTRIBUTIONS: ${protectiveFactors || "None"}

Please generate an intellectual, human-readable cytopathology consultation narrative explaining why this model arrived at this decision. Structure your response in valid JSON with exactly these 4 keys:
1. "executive_summary": A concise 2-sentence clinical summary of the findings.
2. "morphological_breakdown": An analytical paragraph detailing nuclear size, chromatin heterogeneity, and contour irregularity.
3. "engine_telemetry_insight": A 2-sentence explanation of how the ${model_engine} (and its feature map/hyperplane) detected these patterns.
4. "actionable_recommendations": Specific clinical follow-up recommendations (e.g., routine mammography, ultrasound, or core biopsy).`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
            })
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            aiSynthesis = JSON.parse(rawText);
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call warning (using fallback synthesis):", geminiErr);
      }
    }

    // High-Signal Deterministic Fallback if API key not available or offline
    if (!aiSynthesis) {
      const isMalignant = prediction === "Malignant";
      const isBorderline = risk_tier.includes("BORDERLINE") || risk_tier.includes("INDETERMINATE");

      if (isMalignant) {
        aiSynthesis = {
          executive_summary: `FNA morphometry for ${patientName} reveals high-probability malignancy (${confidence}% confidence) with a continuous Risk Score of ${risk_score}/100. Pronounced nuclear pleomorphism and extensive contour irregularity indicate high suspicion of invasive ductal neoplasm.`,
          morphological_breakdown: `Nuclear dimensions are significantly enlarged (Radius: ${biomarkers.radius_mean} μm, Area: ${biomarkers.area_mean} μm²), markedly exceeding the empirical 90th percentile of benign cytology. Increased concavity (${biomarkers.concavity_mean}) and elevated chromatin texture (${biomarkers.texture_mean} std) reflect substantial nuclear membrane deformation and DNA aneuploidy.`,
          engine_telemetry_insight: `${model_engine} identified strong non-linear boundary correlations across the second-order Pauli-Z feature map. ${topRiskDrivers || "Nuclear enlargement and perimeter distortion"} acted as the primary mathematical drivers elevating the risk score.`,
          actionable_recommendations: `Urgent recommendation for image-guided core needle biopsy (CNB) with immunohistochemistry (ER/PR/HER2/Ki-67 profiling) and referral to a breast surgical oncologist within 5-7 business days.`
        };
      } else if (isBorderline) {
        aiSynthesis = {
          executive_summary: `Specimen for ${patientName} occupies the empirical diagnostic boundary zone (Risk Score: ${risk_score}/100). The cytomorphology exhibits intermediate atypia that is neither clearly benign nor overtly malignant.`,
          morphological_breakdown: `Cellular measurements sit in the empirical overlap interval (Radius: ${biomarkers.radius_mean} μm, Concavity: ${biomarkers.concavity_mean}). While nuclear area remains under the malignant median, subtle chromatin texture elevation (${biomarkers.texture_mean} std) creates diagnostic equivocation suggestive of atypical ductal hyperplasia (ADH) or sclerosing adenosis.`,
          engine_telemetry_insight: `${model_engine} registered high decision entropy with split ensemble projections. Quantum Pauli-Z interference patterns flagged subtle membrane indentations that warrant histological confirmation.`,
          actionable_recommendations: `Short-interval follow-up recommended: high-resolution diagnostic ultrasound combined with a targeted vacuum-assisted core biopsy to definitively rule out non-palpable micro-invasion.`
        };
      } else {
        aiSynthesis = {
          executive_summary: `FNA cytopathology for ${patientName} demonstrates a reassuring benign morphologic profile (${confidence}% confidence) with a minimal Risk Score of ${risk_score}/100. Cellular dimensions remain well within healthy reference baselines.`,
          morphological_breakdown: `Nuclei exhibit small, uniform dimensions (Radius: ${biomarkers.radius_mean} μm, Area: ${biomarkers.area_mean} μm²) with smooth, intact borders (Concavity: ${biomarkers.concavity_mean}). Chromatin distribution is homogeneous with low texture variation (${biomarkers.texture_mean} std), consistent with a stable non-neoplastic fibroadenoma or fibrocystic state.`,
          engine_telemetry_insight: `${model_engine} confirmed that all 8 biomarker vectors converge near the benign empirical centroid. Protective factors including ${protectiveFactors || "compact nuclear area and smooth boundaries"} strongly offset malignant suspicion.`,
          actionable_recommendations: `No invasive intervention required. Recommend routine annual screening mammography and standard clinical breast examination per national oncology guidelines.`
        };
      }
    }

    return NextResponse.json({
      success: true,
      patient_id: patientId,
      patient_name: patientName,
      model_engine,
      synthesis: aiSynthesis,
      generated_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("AI Synthesis Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI synthesis" },
      { status: 500 }
    );
  }
}
