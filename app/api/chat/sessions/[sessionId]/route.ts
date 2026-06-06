import { NextRequest, NextResponse } from "next/server";
import { generateGeminiResponse } from "@/lib/gemini";

// API route for a specific chat session.
// Minimal implementation: forward user messages to Gemini with history.
// (You can later swap this for DB persistence.)

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  return NextResponse.json({
    _id: params.sessionId,
  });
}

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));

    const { message, history } = body as {
      message?: string;
      history?: { role: "user" | "model"; parts: { text: string }[] }[];
    };

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Reuse your symptom-aware Gemini system prompt from lib/gemini.ts
    const reply = await generateGeminiResponse(message.trim(), history ?? []);

    return NextResponse.json({
      reply,
      sessionId: params.sessionId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}


