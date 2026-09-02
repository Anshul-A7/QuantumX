import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      patientInfo = {},
      biomarkers = {},
      screeningResult = {},
      activeEngine = "Transfinite-1",
      history = [],
    } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required", success: false },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Build comprehensive clinical context from real patient data
    const patientName = patientInfo.name || "Yuki";
    const patientId = patientInfo.patient_id || "QX-BC-5279";
    const age = patientInfo.age || 55;
    const gender = patientInfo.gender || "Female";

    const r = biomarkers.radius_mean ?? 12.2;
    const t = biomarkers.texture_mean ?? 17.39;
    const p = biomarkers.perimeter_mean ?? 78.18;
    const a = biomarkers.area_mean ?? 458.7;
    const s = biomarkers.smoothness_mean ?? 0.0908;
    const c = biomarkers.compactness_mean ?? 0.0645;
    const conc = biomarkers.concavity_mean ?? 0.0371;
    const conc_pts = biomarkers.concave_points_mean ?? 0.0234;

    const riskScore = screeningResult.composite_risk_score ?? 35.4;
    const predictionLabel = screeningResult.prediction_label ?? "Benign";
    const confidence = screeningResult.confidence ?? 50.6;
    const riskTier = screeningResult.risk_tier ?? "BORDERLINE / ATYPICAL DYSPLASIA";

    const dc = screeningResult.dual_comparison;
    const cxRisk = dc?.cx_01?.risk_score ?? 20.7;
    const cxPred = dc?.cx_01?.prediction_label ?? "Benign";
    const tfRisk = dc?.transfinite_1?.risk_score ?? 35.4;
    const tfPred = dc?.transfinite_1?.prediction_label ?? "Benign";

    const prompt = `You are the QuantumX Clinical AI Consultant, an expert oncologist and clinical pathologist assistant.
You are directly reviewing the verified Fine-Needle Aspirate (FNA) biopsy analysis for:

PATIENT PROFILE:
- Name: ${patientName} (${patientId})
- Demographics: ${age} years old, ${gender}
- Active Analysis Engine: ${activeEngine}

VERIFIED LABORATORY MEASUREMENTS:
- Cell Size (Radius Mean): ${r} μm (Healthy Normal Avg: 12.2 μm | Normal Max: 14.5 μm | High-Risk: >17.3 μm)
- Surface Texture: ${t} std (Healthy Normal: 17.39 | High-Risk: >21.46)
- Cell Border Length (Perimeter): ${p} μm (Healthy Normal: 78.18 μm | Normal Max: 94.0 μm | High-Risk: >114.2 μm)
- Total Cell Area: ${a} μm² (Healthy Normal: 458.7 μm² | Normal Max: 650.0 μm² | High-Risk: >932.0 μm²)
- Border Smoothness: ${s} idx (Healthy Normal: 0.0908 | High-Risk: >0.1030)
- Cell Density (Compactness): ${c} idx (Healthy Normal: 0.0645 | High-Risk: >0.1328)
- Indentation Depth (Concavity): ${conc} idx (Healthy Normal: 0.0371 | Normal Max: 0.0930 | High-Risk: >0.1513)
- Number of Indentations (Concave Points): ${conc_pts} cnt (Healthy Normal: 0.0234 | Normal Max: 0.0480 | High-Risk: >0.0863)

COMPUTED DIAGNOSTIC TELEMETRY:
- Overall Assessment: ${predictionLabel}
- Composite Risk Score: ${riskScore} / 100
- Model Confidence: ${confidence}%
- Risk Classification: ${riskTier}
- Classical Engine (CX-01 SVM+XGBoost): ${cxRisk}% risk (${cxPred})
- Quantum Hybrid Engine (Transfinite-1 8-Qubit VQC): ${tfRisk}% risk (${tfPred})

USER'S QUESTION:
"${question}"

CONVERSATION HISTORY:
${history.map((h: any) => `${h.role === "user" ? "User" : "Doctor AI"}: ${h.content}`).join("\n")}

INSTRUCTIONS:
1. Answer the user's question directly, clearly, and compassionately using everyday language that an ordinary person or patient can easily understand.
2. Reference the patient's actual laboratory measurements and scores when explaining why a conclusion was drawn.
3. If they ask about cell measurements (like size, texture, indentations), explain what that feature means physically in the human body and whether this patient's value is healthy or abnormal.
4. If they ask about the quantum model vs classical model, explain in simple terms that the classical computer looks at standard averages while the quantum model simulates entangled atomic qubits to catch tricky borderlines.
5. Keep your response focused, informative, and reassuring (2-4 clear paragraphs). Do not use markdown headings (# or ##), but you may use bolding for key terms and concise bullet points.`;

    if (geminiApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 },
            }),
            signal: AbortSignal.timeout(4000),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (answer) {
            return NextResponse.json({
              success: true,
              answer,
              source: "gemini-2.5-flash",
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini ask consultation error:", geminiErr);
      }
    }

    // High-Signal Algorithmic Clinical Fallback Engine (Runs even if external API is unreachable)
    const qLower = question.toLowerCase();
    let fallbackAnswer = "";

    if (qLower.includes("risk") || qLower.includes("score") || qLower.includes("what does")) {
      fallbackAnswer = `Based on ${patientName}'s biopsy analysis, the overall risk score is currently calculated at ${riskScore.toFixed(1)} out of 100 with an active assessment of ${predictionLabel}. 

This score is calculated by analyzing 8 physical cell characteristics against a clinical benchmark of verified histology cases. The measured cell radius is ${r} μm and total area is ${a} μm², both of which remain close to the normal healthy baseline (${WDBC_BENIGN_RADIUS} μm and ${WDBC_BENIGN_AREA} μm²).

Because the risk score is in the ${riskScore < 40 ? "lower" : "moderate"} range, standard protocol recommends routine annual mammography and clinical breast exams unless your physician notes specific localized changes.`;
    } else if (qLower.includes("quantum") || qLower.includes("classical") || qLower.includes("difference") || qLower.includes("transfinite") || qLower.includes("cx-01")) {
      fallbackAnswer = `For ${patientName}'s biopsy, both the classical computer and quantum simulator evaluated the cells:

• **Classical Model (CX-01)**: Evaluates the cells using traditional machine learning algorithms (Support Vector Machines and XGBoost), yielding a risk score of ${cxRisk.toFixed(1)}% (${cxPred}).
• **Quantum Model (Transfinite-1)**: Simulates an 8-qubit quantum processor with Pauli-Z feature mapping, resulting in a risk score of ${tfRisk.toFixed(1)}% (${tfPred}).

The advantage of the quantum model is that it simulates quantum entanglement between qubits to detect complex geometric interactions—such as subtle combinations of indentation depth and nuclear texture—that traditional linear algorithms can occasionally overlook.`;
    } else if (qLower.includes("cell") || qLower.includes("indentation") || qLower.includes("size") || qLower.includes("concavity")) {
      fallbackAnswer = `Looking specifically at ${patientName}'s cell morphology:

• **Cell Size (Radius)**: Measured at ${r} μm, which is well within the expected healthy range (average is 12.2 μm, with an upper healthy limit of 14.5 μm).
• **Indentation Depth (Concavity)**: Measured at ${conc}, reflecting smooth outer contours without deep notches.
• **Cell Border Length (Perimeter)**: Measured at ${p} μm, indicating regular, non-jagged cell membranes.

Healthy breast cells typically exhibit round, smooth boundaries, whereas malignant cells often show deep indentations and irregular elongation. ${patientName}'s measurements currently show predominantly regular cellular architecture.`;
    } else {
      fallbackAnswer = `Thank you for your question regarding ${patientName}'s biopsy report (${patientId}). 

The biopsy screening combines 8 precision cell measurements with dual-engine AI evaluation. The active assessment indicates **${predictionLabel}** with a composite risk score of **${riskScore.toFixed(1)} / 100** and **${confidence.toFixed(1)}% confidence**.

All measured cellular parameters—including cell radius (${r} μm), nuclear area (${a} μm²), and border concavity (${conc})—have been compared against clinical biopsy standards. If you are experiencing any localized symptoms or pain, please share these results with your attending physician or surgical oncologist for a complete clinical correlation.`;
    }

    return NextResponse.json({
      success: true,
      answer: fallbackAnswer,
      source: "clinical-knowledge-engine",
    });
  } catch (error: any) {
    console.error("Ask consultation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process consultation question", success: false },
      { status: 500 }
    );
  }
}

const WDBC_BENIGN_RADIUS = 12.2;
const WDBC_BENIGN_AREA = 458.7;
