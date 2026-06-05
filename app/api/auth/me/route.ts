import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    console.log("[GET /api/auth/me] Forwarding to backend");

    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: auth },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[GET /api/auth/me] Backend error:", res.status, data);
      return NextResponse.json(
        { message: data.message || "Unauthorized" },
        { status: res.status }
      );
    }

    // session-context expects: { user: { _id, name, email } }
    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/auth/me] Unexpected error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
