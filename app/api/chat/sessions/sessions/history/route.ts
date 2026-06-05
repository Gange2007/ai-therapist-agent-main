import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Params = { params: { sessionId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${API}/chat/sessions/${params.sessionId}/history`, {
      headers: { Authorization: auth },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
