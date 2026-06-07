import { NextRequest, NextResponse } from "next/server";

const API_RAW = process.env.NEXT_PUBLIC_API_URL;

// Backend base might be provided as either:
// - http://localhost:5000 (no /api)
// - http://localhost:5000/api
function normalizeBackendBase(url?: string) {
  if (!url) return undefined;
  return url.endsWith("/api") ? url : `${url}/api`;
}

const API = normalizeBackendBase(API_RAW);


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!API) {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_API_URL is not set in environment variables" },
        { status: 500 }
      );
    }

    console.log("[LOGIN] Sending request to backend:", `${API}/auth/login`);

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();

    // Try to parse JSON; if not JSON, return helpful diagnostic info
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("[LOGIN] Non-JSON response from backend. status:", res.status, "url:", res.url);
      console.error("[LOGIN] Response preview:", text.slice(0, 1024));

      return NextResponse.json(
        {
          message:
            "Backend did not return JSON. Check NEXT_PUBLIC_API_URL and backend deployment.",
          backendStatus: res.status,
          backendUrl: res.url,
          rawPreview: text.slice(0, 1024),
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error("[LOGIN] Backend error:", res.status, data);
      return NextResponse.json({ message: data.message || "Login failed" }, { status: res.status });
    }

    console.log("[LOGIN] Success for:", email);

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[LOGIN] Unexpected error:", err);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}