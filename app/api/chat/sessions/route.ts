import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      _id: "1",
      title: "Demo Therapy Session",
    },
  ]);
}

export async function POST() {
  return NextResponse.json({
    _id: "new",
    title: "New Session",
  });
}