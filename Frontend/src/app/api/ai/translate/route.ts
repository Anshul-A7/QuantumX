import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage, languageName } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and targetLanguage are required" },
        { status: 400 }
      );
    }

    if (targetLanguage === "en") {
      return NextResponse.json({
        success: true,
        translatedText: text,
      });
    }

    let translatedOutput: string | null = null;

    // 1. First Attempt: Google Gemini AI Translation
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiApiKey) {
      try {
        const prompt = `You are an expert healthcare linguist and compassionate medical translator.
Translate and rewrite the following medical screening summary into ${languageName} (${targetLanguage}).
RULES:
1. Use simple, everyday, comforting words that an ordinary patient can understand.
2. Maintain natural grammar, accurate clinical context, and fluent phrasing in ${languageName}.
3. Output ONLY the translated paragraph text without any conversational preamble or quotation marks.

Text to translate:
"""
${text}
"""`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidate) {
            translatedOutput = candidate;
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini translation API note:", geminiErr);
      }
    }

    // 2. Second Attempt: Real High-Precision Multi-Lingual Translation Engine
    if (!translatedOutput) {
      try {
        // Split text into coherent sentences to preserve translation quality
        const sentences = text
          .split(/(?<=[.?!])\s+/)
          .map((s: string) => s.trim())
          .filter(Boolean);

        const translatedParts: string[] = [];

        for (const sentence of sentences) {
          const enc = encodeURIComponent(sentence);
          const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${enc}&langpair=en|${targetLanguage}`,
            {
              headers: { "User-Agent": "QuantumX-Platform/1.0" },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const translatedSentence = data?.responseData?.translatedText;
            if (
              translatedSentence &&
              !translatedSentence.toLowerCase().includes("mymemory warning") &&
              !translatedSentence.toLowerCase().includes("quota exceeded")
            ) {
              translatedParts.push(translatedSentence);
            } else {
              translatedParts.push(sentence);
            }
          } else {
            translatedParts.push(sentence);
          }
        }

        if (translatedParts.length > 0) {
          translatedOutput = translatedParts.join(" ");
        }
      } catch (transErr) {
        console.warn("Translation service note:", transErr);
      }
    }

    return NextResponse.json({
      success: true,
      translatedText: translatedOutput || text,
      targetLanguage,
      languageName,
      translated: translatedOutput !== null && translatedOutput !== text,
    });
  } catch (error: any) {
    console.error("Translation route error:", error);
    return NextResponse.json(
      { error: error.message || "Translation failed", success: false },
      { status: 500 }
    );
  }
}
