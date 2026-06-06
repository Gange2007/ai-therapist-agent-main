import { NextRequest, NextResponse } from "next/server";

// API route for a specific chat session.
// Implement GET/POST as needed.

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  // TODO: replace with real session fetch logic.
  return NextResponse.json({
    _id: params.sessionId,
  });
}

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  // TODO: replace with real “send message / append history” logic.
  const body = await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    sessionId: params.sessionId,
    body,
  });
}

