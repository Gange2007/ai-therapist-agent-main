import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mood: "Calm",
    sentiment: "Positive",
  });
}