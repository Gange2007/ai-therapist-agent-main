import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are Aura, a clinically-oriented companion who communicates clearly, concisely, and safely.

PRINCIPLES:
1. Use a clinician-style tone that is precise, neutral, and empathetic.
2. Never provide a medical diagnosis. Frame possible causes as general possibilities and include the line: "I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.".
3. Prioritize safety. If red-flag symptoms or crisis indicators appear, encourage the user to seek immediate emergency care or a crisis hotline.
4. When the user reports symptoms, provide:
  - A brief acknowledgement.
  - A short bulleted list (•) of plausible, high-level causes.
  - A short bulleted list (•) of safe self-care steps to consider.
  - Two focused follow-up questions to clarify onset, severity, and red flags.
5. When the user expresses emotional distress such as anxiety, stress, or depression, be supportive while still keeping the response structured and safety-focused.`;

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      console.error("[POST /api/chat] OPENAI_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service is not configured. Please check your OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.error("[POST /api/chat] Failed to parse request body as JSON");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { message, history } = body as {
      message?: string;
      history?: { role: "user" | "model" | "assistant"; parts: { text: string }[] }[];
    };

    if (!message || typeof message !== "string" || message.trim() === "") {
      console.error("[POST /api/chat] Missing or empty message field");
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history ?? []).map((msg) => ({
        role: msg.role === "assistant" || msg.role === "model" ? "assistant" : "user",
        content: msg.parts.map((part) => part.text).join(" "),
      })),
      { role: "user", content: message.trim() },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[POST /api/chat] OpenAI error:", data);
      return NextResponse.json({ error: data.error?.message || "OpenAI request failed" }, { status: response.status || 500 });
    }

    const reply = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reply }, { status: 200 });
  } catch (err: any) {
    const message = err?.message || "Unknown error";
    console.error("[POST /api/chat] Error:", message);
    return NextResponse.json({ error: "Failed to generate response", details: message }, { status: 500 });
  }
}
