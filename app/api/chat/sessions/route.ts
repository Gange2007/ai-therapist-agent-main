import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    console.log("[GET /api/chat/sessions] Forwarding to backend");

    const res = await fetch(`${API}/chat/sessions`, {
      headers: { Authorization: auth },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[GET /api/chat/sessions] Backend error:", res.status, data);
      return NextResponse.json({ error: data.message || data.error || "Failed to fetch sessions" }, { status: res.status });
    }

    console.log("[GET /api/chat/sessions] Sessions fetched successfully");
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[GET /api/chat/sessions] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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

    console.log("[POST /api/chat/sessions] Forwarding to backend");

    const res = await fetch(`${API}/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[POST /api/chat/sessions] Backend error:", res.status, data);
      return NextResponse.json({ error: data.message || data.error || "Failed to create session" }, { status: res.status });
    }

    console.log("[POST /api/chat/sessions] Session created successfully");
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[POST /api/chat/sessions] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}