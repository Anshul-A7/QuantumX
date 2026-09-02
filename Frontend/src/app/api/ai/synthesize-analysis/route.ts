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
        const prompt = `You are a healthcare specialist explaining breast biopsy screening results to a patient in simple everyday words.
CRITICAL RULES:
- Write exactly ONE cohesive, compassionate, and clear paragraph (3 to 4 sentences).
- Use simple, everyday words that any normal person can easily understand.
- DO NOT use complicated medical jargon, scary terms, or technical abbreviations.
- Explain what the test result means in plain words (whether the sample looks healthy and normal, or if a doctor needs to check it further).
- Explain what the cell size and cell edges mean in simple terms (e.g. smooth and normal size vs. enlarged with uneven edges).
- Give a reassuring and clear next step (like routine periodic checkups or showing the results to a doctor for a follow-up check).
- DO NOT mention AI, Gemini, models, algorithms, or prompts. Write as a caring health specialist.

PATIENT: ${patientName}, Age ${age}, Gender ${gender}
RESULT: ${prediction} (${confidence}% Certainty)
RISK SCORE: ${risk_score} out of 100 (${risk_tier})
CELL MEASUREMENTS:
- Average Cell Size: ${biomarkers.radius_mean} micrometers
- Cell Area: ${biomarkers.area_mean} square micrometers
- Cell Edge Smoothness: ${biomarkers.smoothness_mean}
- Cell Border Indentations: ${biomarkers.concavity_mean}

Respond with valid JSON containing a single key "summary_paragraph" containing the cohesive explanation paragraph.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
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
            const parsed = JSON.parse(rawText);
            aiSynthesis = parsed.summary_paragraph || parsed.executive_summary || rawText;
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call warning (using fallback synthesis):", geminiErr);
      }
    }

    // High-Signal Simple Plain Everyday Language Fallback Paragraph
    if (!aiSynthesis) {
      const isMalignant = prediction === "Malignant";
      const isBorderline = risk_tier.includes("BORDERLINE") || risk_tier.includes("INDETERMINATE");

      if (isMalignant) {
        aiSynthesis = `The biopsy screening for ${patientName} shows an elevated risk score of ${risk_score} out of 100 with ${confidence}% certainty. The examined cells are noticeably enlarged with uneven and irregular edges, which indicates unusual cell changes that need prompt medical attention. We strongly recommend sharing these findings with your doctor for a follow-up ultrasound or consultation so they can guide the right next steps.`;
      } else if (isBorderline) {
        aiSynthesis = `The biopsy screening for ${patientName} shows borderline measurements with a moderate risk score of ${risk_score} out of 100. The cells show mild variations in size and slightly uneven borders, which are often non-cancerous but benefit from a routine follow-up check. We advise checking in with your doctor to consider a repeat checkup or ultrasound in a few months to ensure the tissue stays stable.`;
      } else {
        aiSynthesis = `Good news: the biopsy test for ${patientName} shows reassuring and healthy results (${confidence}% certainty) with a low risk score of ${risk_score} out of 100. The examined cells are of standard, healthy size with smooth, even borders characteristic of typical, non-cancerous breast tissue. No urgent steps are needed, and continuing with your regular periodic checkups is recommended.`;
      }
    }

    const summaryParagraph = typeof aiSynthesis === "string" ? aiSynthesis : (aiSynthesis.summary_paragraph || aiSynthesis.executive_summary || "");

    return NextResponse.json({
      success: true,
      patient_id: patientId,
      patient_name: patientName,
      model_engine,
      summary: summaryParagraph,
      synthesis: {
        summary_paragraph: summaryParagraph,
        executive_summary: summaryParagraph,
        morphological_breakdown: summaryParagraph,
        actionable_recommendations: "Follow up with your healthcare provider for routine care."
      },
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
