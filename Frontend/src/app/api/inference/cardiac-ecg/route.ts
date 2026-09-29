import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getBackendUrl(): string {
  if (process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL.replace(/\/$/, "");
  }
  if (
    process.env.NEXT_PUBLIC_API_URL &&
    !process.env.NEXT_PUBLIC_API_URL.includes("localhost") &&
    !process.env.NEXT_PUBLIC_API_URL.includes("127.0.0.1")
  ) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "https://quantumx-34qu.onrender.com";
  }
  return "http://127.0.0.1:8000";
}

/**
 * Production Next.js API Route for Cardiac ECG Inference.
 * 100% Real-Time Live Integration with Dual-Engine SOTA Backend:
 *   - Classical: QuantumX ECGConVT Classical (ResNet-34 + Concat Pooling)
 *   - Quantum: QuantumX Universal PQC (8-Qubit Universal Data Re-Uploading PQC)
 * Zero Mock Data - Zero Synthetic Placeholders.
 */
export async function POST(req: NextRequest) {
  let filename = "patient_ecg.jpg";
  let imageBase64 = "";

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const bodyPayload = await req.json();
      filename = bodyPayload?.filename || "patient_ecg.jpg";
      imageBase64 = bodyPayload?.image_base64 || "";
    } else {
      const formData = await req.formData();
      const fileObj = formData.get("file");
      if (fileObj && typeof fileObj === "object" && "arrayBuffer" in fileObj) {
        filename = (fileObj as any).name || "patient_ecg.jpg";
        const buffer = await (fileObj as File).arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");
        const mime = (fileObj as File).type || "image/jpeg";
        imageBase64 = `data:${mime};base64,${base64Data}`;
      } else {
        const b64Field = formData.get("image_base64");
        if (typeof b64Field === "string") {
          imageBase64 = b64Field;
        }
        const fnField = formData.get("filename");
        if (typeof fnField === "string") {
          filename = fnField;
        }
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { detail: "No ECG image file or base64 data provided in request." },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();
    const targetEndpoint = `${backendUrl}/inference/cardiac-ecg`;

    // Forward authentic payload to the real Python Dual-Engine backend
    const upstreamResp = await fetch(targetEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        filename: filename,
      }),
      signal: AbortSignal.timeout(60000), // 60s timeout for quantum statevector simulation
    });

    if (!upstreamResp.ok) {
      const errJson = await upstreamResp.json().catch(() => ({}));
      const detail = errJson.detail || `Cardiac engine failed with status ${upstreamResp.status}`;
      return NextResponse.json({ detail }, { status: upstreamResp.status });
    }

    const liveData = await upstreamResp.json();
    return NextResponse.json(liveData);
  } catch (error: any) {
    console.error("[Cardiac ECG API] Upstream inference error:", error);
    return NextResponse.json(
      {
        detail: `Cardiac inference upstream error: ${error?.message || "Failed to reach inference server"}`,
      },
      { status: 502 }
    );
  }
}
