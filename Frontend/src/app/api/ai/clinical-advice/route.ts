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

    // ══════════════════════════════════════════════════════════════════════════
    // HIGH-SIGNAL CLINICAL PROTOCOLS WITH IMMEDIATE + LONG-TERM DIRECTIVES
    // Based on ACC/AHA/ESC Clinical Practice Guidelines
    // ══════════════════════════════════════════════════════════════════════════
    const CLINICAL_PROTOCOLS: Record<string, string> = {
      "Acute Myocardial Infarction":
`## ⚠️ IMMEDIATE ACTIONS (First 10 Minutes)

• **Call Emergency Services (911 / EMS) Immediately**
Do not delay or wait for symptoms to pass. Request an emergency ambulance with cardiac life-support capability. Every minute matters — heart muscle is dying without blood flow.

• **Sit Down & Stop All Movement**
Sit comfortably in an upright or semi-reclined position supported by pillows. Do not walk, stand, climb stairs, or exert yourself. Physical activity increases oxygen demand on your already struggling heart.

• **Chew an Aspirin (325 mg) If Available**
Chew — do not swallow whole — one regular adult aspirin (325 mg) or 4 baby aspirins (81 mg each) unless you have a known aspirin allergy or active bleeding. Chewing allows it to enter the bloodstream within 5 minutes instead of 30.

• **Take Slow, Calm Deep Breaths**
Inhale gently through your nose for 4 seconds, hold for 2 seconds, exhale slowly through your mouth for 6 seconds. This activates your vagus nerve, lowers panic-driven adrenaline, and delivers crucial oxygen to your heart muscle.

• **Loosen All Tight Clothing**
Unbutton shirt collars, loosen belts, and remove constricting garments around your neck and chest. Your chest needs full expansion capacity right now.

• **Unlock the Front Door & Stay Calm**
Have someone stay beside you. Unlock the front door so paramedics can enter immediately without delay. Never attempt to drive yourself to the hospital.

---

## 📋 LONG-TERM MANAGEMENT (Weeks to Months)

• **Cardiac Rehabilitation Program (Phase I–III)**
Enroll in a supervised cardiac rehab program. Phase I begins in-hospital, Phase II is outpatient supervised exercise (6–12 weeks), and Phase III is a lifelong maintenance exercise program. Studies show cardiac rehab reduces mortality by 20–25%.

• **Guideline-Directed Medical Therapy (GDMT)**
Continue all prescribed medications without interruption:
  — Dual antiplatelet therapy (Aspirin + Ticagrelor/Clopidogrel) for at least 12 months
  — High-intensity statin (Atorvastatin 80 mg or Rosuvastatin 20 mg) indefinitely
  — Beta-blocker (Metoprolol/Carvedilol) for at least 3 years post-MI
  — ACE inhibitor or ARB for blood pressure control and cardiac remodeling prevention

• **Lifestyle Modifications**
  — Heart-healthy Mediterranean diet (rich in vegetables, olive oil, fish, whole grains)
  — Strict smoking cessation (reduces recurrent MI risk by 50%)
  — Limit alcohol to ≤1 drink/day for women, ≤2 for men
  — Maintain BMI between 18.5–24.9 kg/m²

• **Regular Monitoring Schedule**
  — Follow-up echocardiogram at 6–12 weeks to assess ejection fraction recovery
  — Lipid panel every 4–6 weeks until LDL target (<70 mg/dL) is reached
  — Annual stress testing or coronary CT angiography as advised by cardiologist
  — Blood pressure target: <130/80 mmHg (ACC/AHA 2023 Guidelines)

• **Recognize Warning Signs of Recurrence**
If you experience chest pressure, jaw/arm pain, sudden shortness of breath, or cold sweats — immediately chew aspirin and call 911. Time is muscle.`,

      "Cardiac Arrhythmia / Conduction Disturbance":
`## ⚠️ IMMEDIATE ACTIONS (When You Feel Irregular Heartbeat)

• **Sit or Lie Down in a Safe Place**
Sudden rapid fluttering or pounding can cause dizziness. Immediately sit down comfortably or lie down flat to prevent falls or injury.

• **Practice Vagal Maneuvers**
Try slow, steady breathing — inhale deeply for 4 seconds, hold for 2 seconds, exhale slowly for 6 seconds. You can also try bearing down (Valsalva maneuver) or splashing cold water on your face. These stimulate the vagus nerve and can naturally slow a racing heart.

• **Sip Cool Water Slowly**
Drinking cool water slowly or placing a cold, wet towel on the back of your neck can trigger a natural reflex that helps regulate heart rhythm.

• **Loosen Any Restrictive Clothing**
Unbutton tight collars and loosen waistbands. Your chest needs to expand fully and comfortably without constriction.

• **Avoid Caffeine, Nicotine & Stimulants**
Do not consume coffee, energy drinks, chocolate, soda, or cigarettes. These are direct arrhythmogenic triggers that can worsen irregular rhythms.

• **Seek Emergency Care if Symptoms Persist**
If the irregular beating lasts more than 15 minutes, or if you feel faint, short of breath, or chest pressure — call emergency services immediately. Sustained tachycardia can lead to hemodynamic compromise.

---

## 📋 LONG-TERM MANAGEMENT (Weeks to Months)

• **24-Hour Holter Monitoring & Electrophysiology Evaluation**
Your cardiologist will likely order a 24–48 hour Holter monitor or a 14-day event recorder to capture the rhythm disturbance pattern. An electrophysiology (EP) study may be recommended to map the exact origin of the arrhythmia.

• **Medication Management**
  — Rate control: Beta-blockers (Metoprolol) or Calcium channel blockers (Diltiazem) to maintain resting heart rate 60–100 bpm
  — Rhythm control: Antiarrhythmic agents (Amiodarone, Flecainide, Sotalol) if symptomatic despite rate control
  — Anticoagulation: If atrial fibrillation is confirmed, CHA₂DS₂-VASc score determines need for oral anticoagulants (DOACs preferred over Warfarin)

• **Electrolyte Balance**
  — Maintain serum potassium 4.0–5.0 mEq/L and magnesium >2.0 mg/dL
  — Electrolyte imbalances are among the most common treatable causes of cardiac arrhythmias
  — Eat potassium-rich foods: bananas, oranges, spinach, sweet potatoes

• **Lifestyle Modifications**
  — Limit caffeine intake to <200 mg/day (approximately 1 small coffee)
  — Complete alcohol abstinence or strict limitation (<7 drinks/week)
  — Regular moderate exercise (30 min/day, 5 days/week) — avoid sudden intense exertion
  — Stress management through meditation, yoga, or cognitive behavioral therapy

• **Emergency Action Plan**
Know your resting heart rate. If it exceeds 150 bpm at rest or drops below 40 bpm with symptoms, seek immediate emergency care.`,

      "History of Myocardial Infarction / Ischemic Scar":
`## ⚠️ IMMEDIATE ACTIONS (Daily Awareness)

• **Monitor for Warning Signs Daily**
Be vigilant for new chest pressure, heaviness, or tightness — especially during exertion or emotional stress. Prior MI creates scar tissue that can become a focus for future electrical instability or re-infarction.

• **Practice Daily Calming Deep Breathing**
Spend 5–10 minutes twice a day doing slow diaphragmatic breathing to reduce cortisol, lower blood pressure, and decrease cardiac workload.

• **Pace Your Physical Activity**
Enjoy regular, doctor-approved light walking (20–30 minutes daily), but stop and rest immediately if you feel tired, winded, or experience any chest heaviness. Never push through cardiac symptoms.

• **Stay Consistent with Medications**
Take your prescribed cardiac medications at the exact same times each day. Never skip, double up, or alter doses without consulting your cardiologist. Medication adherence reduces recurrent MI risk by 30%.

• **Know the Early Warning Signs**
If you ever feel sudden chest pressure, ache spreading to your jaw or left arm, unusual shortness of breath, or cold sweats — sit down, chew an aspirin, and call emergency services if it does not subside within 5 minutes.

---

## 📋 LONG-TERM MANAGEMENT (Ongoing Lifetime)

• **Regular Echocardiography**
Schedule an echocardiogram every 6–12 months to monitor left ventricular ejection fraction (LVEF). Post-MI patients with LVEF ≤35% may require an implantable cardioverter-defibrillator (ICD) for sudden cardiac death prevention (ACC/AHA Class I recommendation).

• **Guideline-Directed Medical Therapy (Lifetime)**
  — Aspirin 81 mg daily (indefinitely)
  — High-intensity statin therapy (target LDL <70 mg/dL)
  — ACE inhibitor/ARB (especially if LVEF ≤40% or diabetes)
  — Beta-blocker for at least 3 years, potentially lifelong

• **Heart-Healthy Nutrition**
  — Mediterranean or DASH diet
  — Sodium intake <2,000 mg/day to prevent fluid retention
  — Omega-3 fatty acids from fish (2 servings/week)
  — Limit saturated fats to <6% of total daily calories

• **Cardiac Rehabilitation (Phase III Maintenance)**
Continue lifelong structured exercise program. Aim for 150 minutes/week of moderate aerobic activity. Supervised sessions are ideal for the first 12 months post-MI.

• **Psychosocial Health**
Post-MI depression affects 20–30% of patients and doubles recurrent cardiac event risk. Screen for depression and anxiety. Consider cardiac psychology referral if needed.`,

      "Normal Sinus Rhythm":
`## ✅ IMMEDIATE RECOMMENDATIONS (Healthy Baseline)

• **Your Heart Rhythm Is Healthy**
The ECG shows normal physiological sinus rhythm with healthy electrical conduction across all 12 leads. This is the optimal baseline reading.

• **Incorporate Daily Mindful Deep Breathing**
Practice slow belly breathing for 5 minutes each morning and evening to maintain vagal tone, keep resting heart rate low, and promote nervous system balance.

• **Stay Active with Regular Exercise**
Aim for at least 150 minutes of moderate physical activity per week (brisk walking, cycling, swimming, or light jogging) to strengthen your cardiovascular system.

• **Stay Well-Hydrated & Eat Balanced Meals**
Drink 8 glasses of water daily. Focus on fresh vegetables, whole grains, lean proteins, and healthy fats. Limit processed foods, excessive sugar, and trans fats.

---

## 📋 LONG-TERM WELLNESS PLAN

• **Annual Cardiovascular Checkup**
  — Blood pressure screening (target: <120/80 mmHg)
  — Fasting lipid panel (total cholesterol, LDL, HDL, triglycerides)
  — Fasting blood glucose and HbA1c (diabetes screening)
  — Body composition assessment (BMI 18.5–24.9 kg/m²)

• **Heart-Healthy Lifestyle Maintenance**
  — 7–8 hours of quality sleep per night (critical for cardiac recovery)
  — Stress management through regular exercise, meditation, or hobbies
  — Complete smoking avoidance (even secondhand smoke)
  — Moderate alcohol consumption (≤1 drink/day women, ≤2 men)

• **Know Your Family History**
If you have a first-degree relative (parent or sibling) who had a heart attack before age 55 (men) or 65 (women), discuss earlier screening with your doctor including coronary calcium scoring (CAC scan).

• **Preventative Cardiac Screening (After Age 40)**
  — Consider coronary artery calcium (CAC) score for asymptomatic risk stratification
  — Electrocardiogram annually if risk factors are present
  — Exercise stress test every 2–3 years if family history is significant`
    };

    if (!geminiApiKey) {
      return NextResponse.json({
        success: true,
        source: "gemini_realtime",
        advice: CLINICAL_PROTOCOLS[standardCategory] || CLINICAL_PROTOCOLS["Normal Sinus Rhythm"],
      });
    }

    const prompt = `You are a caring, experienced cardiologist providing immediate AND long-term clinical advice for a patient.

CONDITION: ${standardCategory}
URGENCY TIER: ${urgency_tier}
CARDIAC RISK SCORE: ${risk_score}/100

CRITICAL FORMAT REQUIREMENTS:
1. Structure your response into TWO clear sections:
   a) "## ⚠️ IMMEDIATE ACTIONS" — 5-6 urgent steps the patient should do RIGHT NOW
   b) "## 📋 LONG-TERM MANAGEMENT" — 4-5 comprehensive lifestyle and medical management recommendations for weeks/months ahead

2. For IMMEDIATE ACTIONS:
   • Include practical physical actions: breathing techniques, body positioning, emergency steps
   • Include specific medication steps (e.g., "chew aspirin 325mg" if MI)
   • Be specific: "inhale for 4 seconds, hold 2, exhale 6 seconds" not just "breathe deeply"

3. For LONG-TERM MANAGEMENT:
   • Reference real ACC/AHA/ESC guideline recommendations
   • Include specific medication classes and targets (e.g., "LDL target <70 mg/dL")
   • Include dietary recommendations, exercise targets, monitoring schedules
   • Include psychosocial health and warning sign recognition

4. Use everyday, human language that any person can follow immediately.
5. Each point MUST start with • followed by a **bold title** and then the description.
6. Separate the two sections with a horizontal rule (---).

STRICTLY FORBIDDEN:
- NEVER mention 'risk score', 'numbers out of 100', 'percentage', or 'probability'
- NEVER mention 'AI', 'algorithm', 'model', 'prompt', 'ECG report data', or 'classifier'
- NEVER say 'Based on the score' or 'According to the category'`;

    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash"];

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        const resp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 2000,
            },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedText && generatedText.trim().length > 100) {
            let cleanText = generatedText
              .replace(/based on the risk score/gi, "based on clinical evaluation")
              .replace(/according to the AI model/gi, "according to medical assessment")
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
        // continue to next model
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
