import { NextRequest, NextResponse } from "next/server";
import { BREAST_CANCER_CANONICAL_SCHEMA, parseUnstructuredMedicalText } from "@/lib/medicalReportParser";
import zlib from "zlib";

function extractTextFromPdfBuffer(buffer: Buffer): string {
  let extractedText = "";
  const str = buffer.toString("latin1");
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const streamData = Buffer.from(match[1], "latin1");
    try {
      const decompressed = zlib.inflateSync(streamData).toString("latin1");
      const textMatches = decompressed.match(/\(([^)]+)\)/g);
      if (textMatches) {
        extractedText += "\n" + textMatches.map((s) => s.slice(1, -1)).join("");
      }
    } catch (e) {
      // not compressed or raw
      const rawMatches = match[1].match(/\(([^)]+)\)/g);
      if (rawMatches) {
        extractedText += "\n" + rawMatches.map((s) => s.slice(1, -1)).join("");
      }
    }
  }
  return extractedText || buffer.toString("utf8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { rawText, base64Data, fileName = "medical_report.pdf" } = body;

    if (base64Data && (!rawText || rawText.length < 50)) {
      const buf = Buffer.from(base64Data, "base64");
      rawText = extractTextFromPdfBuffer(buf);
    }

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "Invalid payload: rawText or base64Data is required." },
        { status: 400 }
      );
    }

    // 1. First-pass rule & regex alias parsing
    const firstPassResult = parseUnstructuredMedicalText(rawText, fileName);

    // 2. Check if GEMINI_API_KEY is present for deep semantic resolution of unmapped items
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && firstPassResult.missingFieldKeys.length > 0) {
      try {
        const prompt = `You are a strict medical pathology data extractor for breast cancer cellular features.
Given the following medical text, extract the numerical values for the target fields.
TARGET FIELDS:
- radius_mean (Cell Size / Nuclear Radius in μm, range 6.0-30.0)
- texture_mean (Surface Texture / gray-scale variance in std, range 9.0-40.0)
- perimeter_mean (Cell Perimeter in μm, range 40.0-190.0)
- area_mean (Nuclear Area in μm², range 140.0-2500.0)
- smoothness_mean (Border Smoothness index, range 0.05-0.25)
- compactness_mean (Compactness index, range 0.01-0.35)
- concavity_mean (Indentation Depth index, range 0.0-0.45)
- concave_points_mean (Indentation Count count, range 0.0-0.25)

CRITICAL RULES:
1. ONLY map the variable names. NEVER modify, round, or alter any numbers. Copy exact numbers.
2. Return ONLY a valid JSON object matching: {"patient_id": "...", "fields": {"radius_mean": 18.25, ...}}

MEDICAL TEXT:
${rawText.slice(0, 3000)}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsedAi = JSON.parse(jsonText);
            if (parsedAi.fields) {
              for (const [k, v] of Object.entries(parsedAi.fields)) {
                const num = parseFloat(String(v));
                if (!isNaN(num) && firstPassResult.missingFieldKeys.includes(k)) {
                  firstPassResult.extractedFields[k] = num;
                  const idx = firstPassResult.fieldMatches.findIndex((m) => m.key === k);
                  if (idx !== -1) {
                    firstPassResult.fieldMatches[idx] = {
                      ...firstPassResult.fieldMatches[idx],
                      extractedValue: num,
                      matchType: "ai_semantic",
                      confidence: 0.98,
                      rawLabel: "AI Semantic Match (from Pathology Notes)",
                    };
                  }
                }
              }
              if (parsedAi.patient_id) {
                firstPassResult.patientId = String(parsedAi.patient_id);
              }
            }
          }
        }
      } catch (aiErr) {
        console.warn("Gemini AI extraction fallback warning:", aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: firstPassResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to parse medical report.", details: err.message },
      { status: 500 }
    );
  }
}
