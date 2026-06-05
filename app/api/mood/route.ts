import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      console.error("[POST /api/mood] No Authorization header provided");
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.error("[POST /api/mood] Failed to parse request body as JSON");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { score, note } = body as { score: unknown; note?: string };

    // Validate score before forwarding
    if (typeof score !== "number" || score < 0 || score > 100) {
      console.error("[POST /api/mood] Invalid mood score:", score);
      return NextResponse.json({ error: "Invalid mood score. Must be a number between 0 and 100." }, { status: 400 });
    }

    // Derive the emotion label from the score so the backend required field is satisfied
    const emotion = scoreToEmotion(score);

    console.log(`[POST /api/mood] Forwarding to backend: score=${score}, emotion=${emotion}`);

    const res = await fetch(`${API}/mood`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({ score, emotion, notes: note }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[POST /api/mood] Backend returned error:", res.status, data);
    } else {
      console.log("[POST /api/mood] Mood saved successfully:", data);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[POST /api/mood] Unexpected error:", err);
    return NextResponse.json({ error: "Server error", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/** Map a 0–100 score to a human-readable emotion label expected by the backend */
function scoreToEmotion(score: number): string {
  if (score <= 10) return "Very Low";
  if (score <= 30) return "Low";
  if (score <= 60) return "Neutral";
  if (score <= 80) return "Good";
  return "Great";
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      console.error("[GET /api/mood] No Authorization header provided");
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    console.log(`[GET /api/mood] Forwarding to backend${query ? ` with query: ${query}` : ""}`);

    const res = await fetch(`${API}/mood${query ? `?${query}` : ""}`, {
      headers: { Authorization: auth },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[GET /api/mood] Unexpected error:", err);
    return NextResponse.json({ error: "Server error", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
