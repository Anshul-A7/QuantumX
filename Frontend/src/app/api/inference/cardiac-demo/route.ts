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
 * Production Next.js API Route for Cardiac Reference Demo Inference.
 * Dispatches to live Python Dual-Engine Backend running real SOTA models
 * on authentic clinical benchmark ECG records.
 */
export async function POST(req: NextRequest) {
  let sampleType = "mi";
  try {
    const body = await req.json();
    sampleType = (body.sample_type || "mi").toLowerCase().trim();
  } catch {
    // default to mi
  }

  const backendUrl = getBackendUrl();
  const targetEndpoint = `${backendUrl}/inference/cardiac-demo`;

  try {
    const resp = await fetch(targetEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample_type: sampleType }),
      signal: AbortSignal.timeout(60000),
    });

    if (resp.ok) {
      const liveData = await resp.json();
      return NextResponse.json(liveData);
    }

    const errJson = await resp.json().catch(() => ({}));
    const detail = errJson.detail || `Backend returned status ${resp.status}`;
    return NextResponse.json({ detail }, { status: resp.status });
  } catch (error: any) {
    console.error(`[Cardiac Demo API] Connection error to ${targetEndpoint}:`, error);
    return NextResponse.json(
      { detail: `Inference backend unreachable: ${error?.message || "Failed to reach inference server"}` },
      { status: 502 }
    );
  }
}
