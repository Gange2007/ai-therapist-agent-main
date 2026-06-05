import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });
    }

    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: auth },
    });

    if (!res.ok) {
      return NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({ isAuthenticated: true, user: data.user }, { status: 200 });
  } catch {
    return NextResponse.json({ isAuthenticated: false, user: null }, { status: 200 });
  }
}
