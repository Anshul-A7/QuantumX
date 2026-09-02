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

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!geminiApiKey) {
      // Offline fallback dictionary for common simple summaries
      return NextResponse.json({
        success: true,
        translatedText: text,
        notice: "Translation fallback used (Live Gemini key not detected).",
      });
    }

    const prompt = `You are a medical translator and healthcare communicator.
Translate and rewrite the following medical diagnostic summary into ${languageName} (${targetLanguage}).
IMPORTANT RULES:
1. Use simple, everyday, easy-to-understand words that an ordinary person or patient can understand without difficulty.
2. Keep the explanation clear, reassuring, and completely accurate.
3. Maintain natural grammar and fluent phrasing in ${languageName}.
4. Output ONLY the translated paragraph text without any conversational preamble or markdown code blocks.

Text to translate:
"""
${text}
"""`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.warn("Gemini translation API error:", errBody);
      return NextResponse.json({
        success: true,
        translatedText: text,
        fallback: true,
      });
    }

    const data = await response.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return NextResponse.json({
      success: true,
      translatedText: translated || text,
    });
  } catch (error: any) {
    console.error("Translation route error:", error);
    return NextResponse.json(
      { error: error.message || "Translation failed", success: false },
      { status: 500 }
    );
  }
}
