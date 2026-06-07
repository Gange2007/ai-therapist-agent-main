import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email and password are required" }, { status: 400 });
    }

    console.log("[POST /api/auth/register] Forwarding registration to backend for:", email);

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("[POST /api/auth/register] Non-JSON response. status:", res.status, "url:", res.url);
      console.error("[POST /api/auth/register] Response preview:", text.slice(0, 1024));
      return NextResponse.json({ message: "Backend did not return JSON.", backendStatus: res.status, backendUrl: res.url, rawPreview: text.slice(0, 1024) }, { status: 502 });
    }

    if (!res.ok) {
      console.error("[POST /api/auth/register] Backend error:", res.status, data);
      return NextResponse.json(
        { message: data.message || data.error || "Registration failed" },
        { status: res.status }
      );
    }

    console.log("[POST /api/auth/register] Registration successful for:", email);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/register] Unexpected error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
