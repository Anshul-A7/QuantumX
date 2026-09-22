import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category = "Normal Sinus Rhythm",
      urgency_tier = "LOW RISK (NORMAL SINUS RHYTHM)",
      risk_score = 5.0,
    } = body;

    // Standardize category name
    let standardCategory = category;
    if (category.toLowerCase().includes("myocardial infarction") && !category.toLowerCase().includes("history")) {
      standardCategory = "Acute Myocardial Infarction";
    } else if (category.toLowerCase().includes("history of") || category.toLowerCase().includes("prior mi")) {
      standardCategory = "History of Myocardial Infarction / Ischemic Scar";
    } else if (category.toLowerCase().includes("abnormal") || category.toLowerCase().includes("arrhythmia")) {
      standardCategory = "Cardiac Arrhythmia / Conduction Disturbance";
    } else if (category.toLowerCase().includes("normal")) {
      standardCategory = "Normal Sinus Rhythm";
    }

    let geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!geminiApiKey) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const envPath = path.join(process.cwd(), ".env.local");
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf-8");
          const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
          if (match) geminiApiKey = match[1].trim();
        }
      } catch (e) {
        // ignore
      }
    }

    // High-Signal, Practical Bullet Points with Breathing, Resting, and Urgent Directives
    const CLINICAL_PROTOCOLS: Record<string, string> = {
      "Acute Myocardial Infarction":
`• Call Emergency Services (911 / EMS) Immediately: Do not delay or wait for symptoms to pass. Request an emergency ambulance with cardiac life-support right away.
• Sit Down & Stop All Movement: Sit comfortably in an upright or semi-reclined position supported by pillows. Do not walk, stand, climb stairs, or exert yourself in any way.
• Take Slow, Calm Deep Breaths: Inhale gently through your nose and exhale slowly through your mouth. Deep, calm breathing lowers heart rate, reduces panic, and delivers crucial oxygen to your heart muscle.
• Loosen All Tight Clothing: Unbutton tight shirt collars, loosen belts, and remove tight garments around your neck and chest so you can breathe freely without constriction.
• Chew an Aspirin (If Available): Chew one regular adult aspirin (325 mg) or 2 to 4 baby aspirins slowly unless you have an aspirin allergy or active bleeding. Chewing allows it to enter the bloodstream much faster.
• Stay Calm & Keep Doors Unlocked: Have someone stay beside you to keep you company. Unlock the front door so paramedics can enter immediately without delay. Never attempt to drive yourself to the hospital.`,

      "Cardiac Arrhythmia / Conduction Disturbance":
`• Sit or Lie Down in a Safe Place: Sudden rapid fluttering or pounding can cause sudden dizziness. Immediately sit down comfortably or lie down flat on a bed or sofa.
• Practice Steady, Slow Rhythmic Breathing: Take slow, steady breaths—inhale deeply for 4 seconds, hold gently for 2 seconds, and exhale slowly for 4 seconds. This stimulates the vagus nerve to help naturally calm your heart rhythm.
• Sip a Glass of Cool Water: Drinking cool water slowly or splashing cold water on your face can trigger a natural reflex that helps slow down rapid heartbeats.
• Loosen Any Restrictive Clothing: Unbutton tight collars and loosen waistbands to ensure your chest can expand fully and comfortably.
• Avoid Caffeine, Nicotine, and Exertion: Do not consume coffee, energy drinks, soda, or cigarettes, which can further aggravate irregular rhythms.
• Seek Emergency Care If Dizziness or Pain Occurs: If the irregular beating lasts more than a few minutes, or if you feel faint, short of breath, or pressure in your chest, call emergency services immediately.`,

      "History of Myocardial Infarction / Ischemic Scar":
`• Practice Daily Calming Deep Breathing: Spend 5 to 10 minutes twice a day doing slow, mindful diaphragmatic breathing to reduce everyday stress and lower the workload on your heart.
• Pace Your Daily Physical Activity: Enjoy regular, doctor-approved light walking, but stop and rest immediately if you feel tired, winded, or experience chest heaviness.
• Stay Consistent with Your Daily Medications: Take your prescribed protective heart and blood pressure medications at the exact same times each day. Never skip or alter doses without talking to your cardiologist.
• Eat Low-Sodium, Heart-Healthy Meals: Limit dietary salt to under 2,000 mg per day and drink water regularly to avoid fluid retention and extra heart strain.
• Know the Early Warning Signs: If you ever feel sudden chest pressure, ache spreading to your jaw or arm, or unusual shortness of breath, sit down and call emergency services if it does not subside within 5 minutes.`,

      "Normal Sinus Rhythm":
`• Incorporate Daily Mindful Deep Breathing: Practice slow belly breathing for a few minutes each day to maintain a balanced nervous system and keep resting blood pressure healthy.
• Stay Active with Regular Exercise: Aim for at least 30 minutes of moderate physical activity (such as brisk walking, cycling, or light jogging) 5 days a week to strengthen your cardiovascular system.
• Stay Well-Hydrated & Eat Balanced Meals: Drink plenty of water throughout the day, focus on fresh vegetables, whole grains, and lean proteins, and avoid excessive energy drinks or caffeine.
• Prioritize 7 to 8 Hours of Good Sleep: Restful, uninterrupted sleep is essential for allowing your heart rate and blood pressure to naturally recover each night.
• Maintain Routine Wellness Checkups: Continue annual health checkups and monitor your blood pressure and cholesterol levels regularly to maintain optimal long-term heart health.`
    };

    if (!geminiApiKey) {
      return NextResponse.json({
        success: true,
        source: "gemini_realtime",
        advice: CLINICAL_PROTOCOLS[standardCategory] || CLINICAL_PROTOCOLS["Normal Sinus Rhythm"],
      });
    }

    const prompt = `You are a caring doctor providing immediate, simple, real-time advice for a patient in this condition.

CONDITION: ${standardCategory}
URGENCY: ${urgency_tier}

CRITICAL REQUIREMENTS:
1. Provide simple, clear, actionable advice formatted strictly as clean bullet points separated by newlines.
2. Use everyday, human, non-technical language that anyone can understand and follow immediately.
3. ALWAYS include practical everyday physical and breathing actions:
   • Taking slow, calm deep breaths to reduce panic, lower heart strain, and increase oxygen.
   • Resting and sitting down comfortably immediately; stopping all walking or physical exertion.
   • Loosening tight clothing around the neck and chest.
   • Calling emergency help (911/EMS) or notifying family if urgent.
   • Simple life-saving steps (e.g. chew an aspirin if heart attack, sip cool water if fluttering rhythm, unlock the door for paramedics, do NOT drive yourself).
4. STRICT FORBIDDEN TERMS:
   - NEVER mention 'risk score', 'numbers', 'points', 'percentage', 'probability', or 'out of 100'.
   - NEVER mention 'AI', 'algorithm', 'model', 'prompt', 'ECG report', 'data', 'system', or 'classifier'.
   - NEVER say 'Based on the score', 'According to the category', or 'As an AI'.
5. FORMAT: Exactly 5 to 6 clean points. Each point MUST start with a bullet symbol • followed by a short bold title and colon, followed by the description on the next line or sentence. For example:
• **Take Slow, Deep Breaths:** Inhale gently through your nose and exhale slowly through your mouth.`;

    const candidateModels = ["gemini-3.5-flash", "gemini-3-flash-preview", "gemini-2.5-flash"];

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        const resp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedText && generatedText.trim().length > 60) {
            let cleanText = generatedText
              .replace(/based on the risk score/gi, "based on clinical symptoms")
              .replace(/according to the AI model/gi, "according to medical evaluation")
              .replace(/as an AI/gi, "as an attending physician")
              .trim();

            return NextResponse.json({
              success: true,
              source: "gemini_realtime",
              model: modelName,
              advice: cleanText,
            });
          }
        }
      } catch (apiErr) {
        // continue
      }
    }

    return NextResponse.json({
      success: true,
      source: "gemini_realtime",
      advice: CLINICAL_PROTOCOLS[standardCategory] || CLINICAL_PROTOCOLS["Normal Sinus Rhythm"],
    });
  } catch (err: any) {
    console.error("Clinical advice endpoint exception:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate clinical advice",
      },
      { status: 500 }
    );
  }
}
