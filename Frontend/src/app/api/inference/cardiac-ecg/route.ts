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
    const contentType = req.headers.get("content-type") || "";
    const backendUrl = getBackendUrl();

    let resp: Response;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      resp = await fetch(`${backendUrl}/inference/cardiac-ecg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
    } else {
      const formData = await req.formData();
      resp = await fetch(`${backendUrl}/inference/cardiac-ecg`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(60000),
      });
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { detail: err.detail || `Backend returned status ${resp.status}` },
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
            ? "Inference execution timed out while executing neural network & quantum circuit."
            : `Unable to connect to cardiac engine at ${getBackendUrl()}: ${error?.message}`,
      },
      { status: 503 }
    );
  }
}
