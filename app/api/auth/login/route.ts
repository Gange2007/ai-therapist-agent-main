import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    console.log("[POST /api/auth/login] Forwarding login to backend for:", email);

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[POST /api/auth/login] Backend error:", res.status, data);
      return NextResponse.json(
        { message: data.message || data.error || "Invalid credentials" },
        { status: res.status }
      );
    }

    console.log("[POST /api/auth/login] Login successful for:", email);
    // data = { user: { _id, name, email }, token }
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[POST /api/auth/login] Unexpected error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
