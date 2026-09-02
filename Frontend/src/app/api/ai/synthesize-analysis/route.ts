import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      biomarkers = {},
      prediction = "Benign",
      confidence = 90.0,
      risk_score = 15.0,
      risk_tier = "LOW RISK (BENIGN / NON-NEOPLASTIC)",
      risk_tag = "LOW_RISK",
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

    let aiSynthesis: any = null;

    if (geminiApiKey) {
      try {
        const prompt = `You are a healthcare specialist explaining breast biopsy cytopathology screening results to a patient in clear, compassionate, everyday language.

INPUT PATIENT CONTEXT:
- Patient Name: ${patientName}
- Age & Gender: ${age} years old, ${gender}
- Primary Diagnostic Assessment: ${prediction} (${confidence}% Certainty)
- Continuous Clinical Risk Score: ${risk_score} out of 100
- Standardized Risk Tag: ${risk_tag} (${risk_tier})
- Key Cell Measurements:
  * Average Cell Size (Radius): ${biomarkers.radius_mean ?? 12.2} micrometers
  * Cell Boundary Indentations (Concavity): ${biomarkers.concavity_mean ?? 0.037}
  * Nuclear Surface Area: ${biomarkers.area_mean ?? 458.7} square micrometers
  * Border Smoothness: ${biomarkers.smoothness_mean ?? 0.091}
  * Indentation Count: ${biomarkers.concave_points_mean ?? 0.023}

CRITICAL GENERATION RULES:
1. Write exactly ONE cohesive, compassionate, and clear summary paragraph (3 to 4 sentences).
2. Clearly mention the Risk Score (${risk_score} out of 100) and the Risk Tag (${risk_tag.replace(/_/g, ' ')}) in the paragraph.
3. Use simple, everyday words that any normal person can easily understand.
4. Explain what the cell size and cell border indentations mean in plain words.
5. Give a reassuring and clear next step (e.g., routine annual checkups for low risk; ultrasound checkup for borderline; or consultation with their doctor for high risk).
6. DO NOT mention AI, Gemini, models, algorithms, or computer prompts. Write as an empathetic health specialist.

OUTPUT FORMAT INSTRUCTION:
You MUST respond with valid JSON matching the following schema and format:

EXAMPLE JSON RESPONSE FORMAT:
\`\`\`json
{
  "risk_score": ${risk_score},
  "risk_tag": "${risk_tag}",
  "risk_tier": "${risk_tier}",
  "clinical_impression": "Reassuring healthy cell architecture with minimal risk.",
  "summary_paragraph": "The biopsy screening for ${patientName} shows reassuring results (${confidence}% certainty) with a low risk score of ${risk_score} out of 100 (${risk_tag.replace(/_/g, ' ')}). The examined cells are of standard, healthy size with smooth, even borders characteristic of typical non-cancerous breast tissue. No urgent intervention is required, and continuing with routine periodic checkups is recommended."
}
\`\`\`

Respond ONLY with valid JSON.`;

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
            aiSynthesis = parsed;
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call warning (using fallback synthesis):", geminiErr);
      }
    }

    // High-Signal Fallback Synthesis aligned with Researched Risk Tiers
    if (!aiSynthesis || !aiSynthesis.summary_paragraph) {
      const isCritical = risk_tag === "CRITICAL_RISK" || risk_score >= 85;
      const isHigh = risk_tag === "HIGH_RISK" || (risk_score >= 65 && risk_score < 85);
      const isBorderline = risk_tag === "BORDERLINE" || (risk_score >= 45 && risk_score < 65);
      const isMild = risk_tag === "MILD_SUSPICION" || (risk_score >= 25 && risk_score < 45);

      let fallbackText = "";
      let impression = "";

      if (isCritical) {
        impression = "High-grade cellular abnormalities requiring urgent clinical workup.";
        fallbackText = `The biopsy screening for ${patientName} shows an elevated risk score of ${risk_score.toFixed(1)} out of 100 with a Critical Risk tag (${confidence.toFixed(1)}% certainty). The examined cells exhibit significant enlargement and irregular, deeply indented borders, indicating noticeable cellular changes. We strongly recommend immediate follow-up with your doctor and surgical oncology team for comprehensive evaluation and guidance.`;
      } else if (isHigh) {
        impression = "Elevated cellular irregularity suspicious for neoplasia.";
        fallbackText = `The biopsy screening for ${patientName} indicates an elevated risk score of ${risk_score.toFixed(1)} out of 100 under the High Risk tag (${confidence.toFixed(1)}% certainty). The cell measurements show noticeable nuclear enlargement and irregular contour patterns. We recommend prompt consultation with your healthcare provider for a core needle biopsy and diagnostic ultrasound review.`;
      } else if (isBorderline) {
        impression = "Intermediate cellular atypia occupying the borderline transition zone.";
        fallbackText = `The biopsy screening for ${patientName} shows borderline measurements with a moderate risk score of ${risk_score.toFixed(1)} out of 100 under the Borderline Atypia tag (${confidence.toFixed(1)}% certainty). The cells show slight variations in size and mild contour irregularities, which often represent benign changes but warrant closer inspection. We advise scheduling a follow-up ultrasound or checkup with your doctor to monitor tissue stability.`;
      } else if (isMild) {
        impression = "Mild reactive cellular variation favoring benign tissue.";
        fallbackText = `The biopsy screening for ${patientName} shows favorable results with a low-to-moderate risk score of ${risk_score.toFixed(1)} out of 100 under the Mild Suspicion tag (${confidence.toFixed(1)}% certainty). The examined cells are predominantly uniform with only slight reactive variations consistent with non-cancerous breast tissue. A routine follow-up checkup in 6 months is recommended to confirm ongoing stability.`;
      } else {
        impression = "Reassuring healthy cell architecture well within normal benign limits.";
        fallbackText = `Good news: the biopsy test for ${patientName} shows reassuring and healthy results (${confidence.toFixed(1)}% certainty) with a low risk score of ${risk_score.toFixed(1)} out of 100 under the Low Risk tag. The examined cells are of standard, healthy size with smooth, even borders characteristic of typical, non-cancerous breast tissue. Continuing with your routine periodic checkups is recommended.`;
      }

      aiSynthesis = {
        risk_score: Number(risk_score.toFixed(1)),
        risk_tag: risk_tag,
        risk_tier: risk_tier,
        clinical_impression: impression,
        summary_paragraph: fallbackText
      };
    }

    const summaryParagraph = typeof aiSynthesis === "string"
      ? aiSynthesis
      : (aiSynthesis.summary_paragraph || aiSynthesis.executive_summary || "");

    return NextResponse.json({
      success: true,
      patient_id: patientId,
      patient_name: patientName,
      model_engine,
      risk_score: aiSynthesis.risk_score ?? Number(risk_score.toFixed(1)),
      risk_tag: aiSynthesis.risk_tag ?? risk_tag,
      risk_tier: aiSynthesis.risk_tier ?? risk_tier,
      clinical_impression: aiSynthesis.clinical_impression ?? "Clinical evaluation complete.",
      summary: summaryParagraph,
      synthesis: {
        summary_paragraph: summaryParagraph,
        executive_summary: summaryParagraph,
        morphological_breakdown: summaryParagraph,
        clinical_impression: aiSynthesis.clinical_impression,
        risk_score: aiSynthesis.risk_score ?? risk_score,
        risk_tag: aiSynthesis.risk_tag ?? risk_tag,
        risk_tier: aiSynthesis.risk_tier ?? risk_tier
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
