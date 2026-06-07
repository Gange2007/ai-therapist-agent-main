import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
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

    console.log("[POST /api/chat/sessions/:id/messages] Forwarding to backend");

    const res = await fetch(`${API}/chat/sessions/${params.sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[POST /api/chat/sessions/:id/messages] Backend error:", res.status, data);
      return NextResponse.json({ error: data.message || data.error || "Failed to send message" }, { status: res.status });
    }

    console.log("[POST /api/chat/sessions/:id/messages] Message sent successfully");
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[POST /api/chat/sessions/:id/messages] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
