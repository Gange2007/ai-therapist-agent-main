import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return NextResponse.json({ message: "No token provided" }, { status: 401 });

    const body = await req.json();
    const res = await fetch(`${API}/activity/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return NextResponse.json({ message: "No token provided" }, { status: 401 });

    const res = await fetch(`${API}/activity/${params.id}`, {
      method: "DELETE",
      headers: { Authorization: auth },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
