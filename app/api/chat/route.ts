import { NextRequest, NextResponse } from "next/server";
import { generateGeminiResponse } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.error("[POST /api/chat] Failed to parse request body as JSON");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { message, history } = body as {
      message?: string;
      history?: { role: "user" | "model"; parts: { text: string }[] }[];
    };

    if (!message || typeof message !== "string" || message.trim() === "") {
      console.error("[POST /api/chat] Missing or empty message field");
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    console.log("[POST /api/chat] Received message:", message.slice(0, 80));

    const reply = await generateGeminiResponse(message.trim(), history ?? []);

    console.log("[POST /api/chat] Sending reply, length:", reply.length);

    return NextResponse.json({ reply }, { status: 200 });
  } catch (err: any) {
    const message = err?.message || "Unknown error";
    console.error("[POST /api/chat] Error:", message);

    // Give a more informative status when the API key is missing or quota exceeded
    if (message.includes("API key") || message.includes("not configured")) {
      return NextResponse.json(
        { error: "AI service is not configured. Please check your GEMINI_API_KEY." },
        { status: 503 }
      );
    }
    if (message.includes("rate limit") || message.includes("quota")) {
      return NextResponse.json(
        { error: message },
        { status: 429 }
      );
    }
    if (message.includes("temporarily unavailable")) {
      return NextResponse.json(
        { error: message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate response", details: message },
      { status: 500 }
    );
  }
}
