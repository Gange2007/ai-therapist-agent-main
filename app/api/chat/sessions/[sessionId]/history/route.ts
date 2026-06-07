import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    console.log("[GET /api/chat/sessions/:id/history] Forwarding to backend");

    const res = await fetch(`${API}/chat/sessions/${params.sessionId}/history`, {
      headers: { Authorization: auth },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[GET /api/chat/sessions/:id/history] Backend error:", res.status, data);
      return NextResponse.json({ error: data.message || data.error || "Failed to fetch history" }, { status: res.status });
    }

    console.log("[GET /api/chat/sessions/:id/history] History fetched successfully");
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[GET /api/chat/sessions/:id/history] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    console.log("[DELETE /api/chat/sessions/:id/history] Forwarding to backend");

    const res = await fetch(`${API}/chat/sessions/${params.sessionId}/history`, {
      method: "DELETE",
      headers: { Authorization: auth },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[DELETE /api/chat/sessions/:id/history] Backend error:", res.status, data);
      return NextResponse.json({ error: data.message || data.error || "Failed to clear history" }, { status: res.status });
    }

    console.log("[DELETE /api/chat/sessions/:id/history] History cleared successfully");
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[DELETE /api/chat/sessions/:id/history] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
