import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userMessage =
  body?.message?.content ||
  body?.content ||
  body?.message ||
  "Hello";

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(userMessage);

    const response = result.response.text();

    return NextResponse.json({
      _id: "1",
      role: "assistant",
      content: response,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      _id: "1",
      role: "assistant",
      content:
        "Sorry, I am unable to respond right now.",
      createdAt: new Date().toISOString(),
    });
  }
}