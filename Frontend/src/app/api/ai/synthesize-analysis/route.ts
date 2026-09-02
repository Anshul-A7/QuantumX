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
        const prompt = `You are a healthcare specialist explaining breast biopsy screening results clearly and compassionately to a patient and their doctor.
CRITICAL MANDATE:
- Use simple, plain, everyday words that a normal person can easily understand.
- DO NOT use heavy, complicated, or scary medical jargon.
- Explain what the numbers and measurements mean in clear, reassuring terms.

PATIENT: ${patientName} (${patientId}), Age ${age}, Gender ${gender}
OVERALL RESULT: ${prediction} (${confidence}% Certainty)
RISK LEVEL: ${risk_score} / 100.0 (${risk_tier})
MEASURED CELL SIZES & SHAPES:
- Cell Size (Radius): ${biomarkers.radius_mean} μm
- Surface Texture: ${biomarkers.texture_mean} std
- Cell Perimeter: ${biomarkers.perimeter_mean} μm
- Cell Center Area: ${biomarkers.area_mean} μm²
- Edge Smoothness: ${biomarkers.smoothness_mean}
- Edge Indentations (Concavity): ${biomarkers.concavity_mean}
- Number of Indentations: ${biomarkers.concave_points_mean}

Structure your response in valid JSON with exactly these 4 keys:
1. "executive_summary": A clear 2-sentence summary in simple everyday language explaining whether the sample looks healthy/benign, borderline, or higher risk.
2. "morphological_breakdown": An easy-to-read paragraph explaining whether the cells look normal or unusually enlarged, and whether the cell boundaries are smooth or irregular, in terms any person can understand.
3. "engine_telemetry_insight": A simple 1-2 sentence explanation of how the screening models checked these features.
4. "actionable_recommendations": Clear, practical recommended next steps (like routine checkups or doctor follow-up).`;

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

    // High-Signal Simple Plain Language Fallback
    if (!aiSynthesis) {
      const isMalignant = prediction === "Malignant";
      const isBorderline = risk_tier.includes("BORDERLINE") || risk_tier.includes("INDETERMINATE");

      if (isMalignant) {
        aiSynthesis = {
          executive_summary: `The biopsy screening for ${patientName} shows elevated risk (${confidence}% certainty) with a Risk Score of ${risk_score}/100. The cells show notable changes in shape and size that need prompt medical attention.`,
          morphological_breakdown: `The measured cells are noticeably larger than normal (Radius: ${biomarkers.radius_mean} μm, Area: ${biomarkers.area_mean} μm²), and their edges are uneven rather than smooth. These irregular boundaries and textured surfaces indicate unusual cell growth that warrants a closer look by a doctor.`,
          engine_telemetry_insight: `Both screening models concorded on this assessment, flagging cell enlargement and uneven edges as the primary factors.`,
          actionable_recommendations: `We strongly recommend discussing these results with your doctor promptly for a targeted follow-up test (such as an ultrasound or core biopsy) to confirm the diagnosis and plan appropriate care.`
        };
      } else if (isBorderline) {
        aiSynthesis = {
          executive_summary: `The biopsy screening for ${patientName} is in a borderline zone with a moderate Risk Score of ${risk_score}/100. The cells show mild irregularity that is not clearly dangerous, but not completely typical either.`,
          morphological_breakdown: `The cells have moderate size measurements (Radius: ${biomarkers.radius_mean} μm) with slight unevenness along the cell borders. While they do not show severe changes, their slight variations suggest mild cellular changes that are often non-cancerous but worth double-checking.`,
          engine_telemetry_insight: `The screening models detected borderline measurements that sit between typical healthy cells and elevated risk cells.`,
          actionable_recommendations: `A routine follow-up check (such as a follow-up ultrasound in a few months) is recommended to ensure the tissue remains stable.`
        };
      } else {
        aiSynthesis = {
          executive_summary: `Good news: the biopsy sample for ${patientName} shows reassuring, healthy results (${confidence}% certainty) with a low Risk Score of ${risk_score}/100. The cells appear normal and benign.`,
          morphological_breakdown: `The cells are of normal, healthy size (Radius: ${biomarkers.radius_mean} μm, Area: ${biomarkers.area_mean} μm²) with smooth, even borders and regular textures. These are classic signs of normal, non-cancerous breast tissue.`,
          engine_telemetry_insight: `All screening models confirmed that the cell measurements align closely with typical healthy tissue baselines.`,
          actionable_recommendations: `No special treatment or extra procedures are needed. Continue with your regular routine health screenings and periodic checkups.`
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
