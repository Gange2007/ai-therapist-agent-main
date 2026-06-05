import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, name, description, duration, completed, moodScore, moodNote } =
      body as Record<string, unknown>;

    if (!type) {
      return NextResponse.json({ error: "Activity type is required" }, { status: 400 });
    }

    // Always send duration as a number (0 if missing/empty)
    const parsedDuration =
      duration !== undefined && duration !== null && duration !== ""
        ? Number(duration)
        : 0;

    const payload = {
      type,
      name: name || type,
      description: description || "",
      duration: isNaN(parsedDuration) ? 0 : parsedDuration,
      completed: completed !== undefined ? completed : true,
      ...(moodScore !== undefined && { moodScore: Number(moodScore) }),
      ...(moodNote !== undefined && { moodNote }),
    };

    console.log("[POST /api/activity] Forwarding to backend:", payload);

    const res = await fetch(`${API}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[POST /api/activity] Backend error:", res.status, data);
    } else {
      console.log("[POST /api/activity] Activity saved:", (data as any)?._id);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[POST /api/activity] Unexpected error:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    const res = await fetch(`${API}/activity${query ? `?${query}` : ""}`, {
      headers: { Authorization: auth },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[GET /api/activity] Unexpected error:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
