import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");

    if (auth) {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { Authorization: auth },
      }).catch(() => {});
    }

    const response = NextResponse.json({ success: true, message: "Logged out." }, { status: 200 });
    response.cookies.set("jwt", "", { httpOnly: true, expires: new Date(0), path: "/" });
    return response;
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
