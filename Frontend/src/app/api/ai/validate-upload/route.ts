import { NextRequest, NextResponse } from "next/server";

/**
 * QuantumX Upload Content Validation API
 *
 * Uses Gemini Vision to classify uploaded images/documents for disease relevance.
 * - For cardiac ECG: determines if an image is actually a 12-lead ECG strip.
 * - For breast cancer: determines if a document contains cytopathology biomarkers.
 *
 * Prevents non-medical content (selfies, wallpapers, bank statements) from
 * reaching inference pipelines.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64Image, targetDisease = "cardiac_ecg", rawText } = body;

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!geminiApiKey) {
      // If no API key, allow through — don't block the user
      return NextResponse.json({
        isValid: true,
        confidence: 0.5,
        description: "Validation service not configured. File accepted with reduced confidence.",
      });
    }

    // ── ECG Image Validation ──────────────────────────────────────────────────

    if (targetDisease === "cardiac_ecg" && base64Image) {
      const prompt = `You are a clinical image classifier. Examine this image carefully.

TASK: Determine if this image is a clinical electrocardiogram (ECG/EKG).

An ECG image typically shows:
- A grid pattern (pink/red grid lines on paper, or digital grid background)
- Waveform traces showing P waves, QRS complexes, T waves
- Multiple leads labeled (I, II, III, aVR, aVL, aVF, V1-V6)
- Time and voltage calibration marks
- Patient information or machine-printed header

This image is NOT an ECG if it is:
- A personal photograph, selfie, or portrait
- A landscape, building, or scenery photo
- A screenshot of a website, app, or document
- A wallpaper, icon, logo, or graphic design
- A medical image that is NOT an ECG (X-ray, MRI, CT scan, ultrasound)
- A chart or graph that is not an electrocardiogram

Respond ONLY with valid JSON:
{
  "is_ecg": true or false,
  "confidence": 0.0 to 1.0,
  "description": "Brief description of what the image appears to be"
}`;

      // Clean base64 — remove data URI prefix if present
      let cleanBase64 = base64Image;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: "image/jpeg",
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            }),
            signal: AbortSignal.timeout(15000),
          },
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            return NextResponse.json({
              isValid: parsed.is_ecg === true,
              confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
              description: parsed.description || "",
              rejectionReason: parsed.is_ecg
                ? undefined
                : `This appears to be ${parsed.description || "a non-ECG image"}. Please upload a 12-lead clinical ECG strip or electrocardiogram recording.`,
            });
          }
        }
      } catch (visionErr) {
        console.warn("[validate-upload] Gemini Vision call failed:", visionErr);
      }

      // Fallback — allow through if Gemini call fails
      return NextResponse.json({
        isValid: true,
        confidence: 0.5,
        description: "Vision validation inconclusive. File accepted with reduced confidence.",
      });
    }

    // ── Tabular/PDF Content Validation ────────────────────────────────────────

    if (targetDisease === "breast_cancer" && rawText) {
      const textPrompt = `You are a medical document classifier. Examine the following text extracted from a document.

TASK: Determine if this document contains breast cancer biopsy or cytopathology cell measurement data.

A relevant document typically contains:
- Cell measurements: radius, texture, perimeter, area, smoothness, compactness, concavity, concave points
- References to Fine Needle Aspirate (FNA), biopsy, cytology, pathology
- Numerical values for cellular morphometric features
- Wisconsin Diagnostic Breast Cancer (WDBC) dataset format

This document is NOT relevant if it is:
- A bank statement, financial document, or invoice
- A personal letter, resume, or non-medical document
- A medical document for a completely different condition (not breast cancer)
- A prescription, pharmacy document, or insurance form

TEXT (first 2000 chars):
${(rawText as string).slice(0, 2000)}

Respond ONLY with valid JSON:
{
  "is_relevant": true or false,
  "confidence": 0.0 to 1.0,
  "description": "Brief description of what the document appears to be"
}`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: textPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            }),
            signal: AbortSignal.timeout(10000),
          },
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            return NextResponse.json({
              isValid: parsed.is_relevant === true,
              confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
              description: parsed.description || "",
              rejectionReason: parsed.is_relevant
                ? undefined
                : `This document appears to be ${parsed.description || "unrelated to breast cancer screening"}. Please upload a pathology lab report containing cellular morphometric data.`,
            });
          }
        }
      } catch (textErr) {
        console.warn("[validate-upload] Gemini text call failed:", textErr);
      }

      return NextResponse.json({
        isValid: true,
        confidence: 0.5,
        description: "Text validation inconclusive. Document accepted with reduced confidence.",
      });
    }

    // Default — accept
    return NextResponse.json({
      isValid: true,
      confidence: 1.0,
      description: "No specific validation required for this input type.",
    });
  } catch (err: any) {
    console.error("[validate-upload] Error:", err);
    // Never block the user on validation errors
    return NextResponse.json({
      isValid: true,
      confidence: 0.5,
      description: "Validation service encountered an error. File accepted.",
    });
  }
}
