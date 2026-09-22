import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendUrl(): string {
  if (process.env.BACKEND_INTERNAL_URL) return process.env.BACKEND_INTERNAL_URL.replace(/\/$/, "");
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sampleType = (body.sample_type || "mi").toLowerCase().trim();
    const backendUrl = getBackendUrl();

    const resp = await fetch(`${backendUrl}/inference/cardiac-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample_type: sampleType }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { detail: errData.detail || `Backend returned status ${resp.status}` },
        { status: resp.status }
      );
    }

    const liveData = await resp.json();
    return NextResponse.json(liveData);
  } catch (error: any) {
    return NextResponse.json(
      {
        detail:
          error?.name === "TimeoutError"
            ? "Inference backend request timed out. The model server may be cold-booting."
            : `Unable to connect to cardiac neural engine at ${getBackendUrl()}: ${error?.message}`,
      },
      { status: 503 }
    );
  }
}
