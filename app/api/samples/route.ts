import { NextResponse } from "next/server";
import { SAMPLE_QUERIES } from "@/lib/samples";

export async function GET() {
  return NextResponse.json(SAMPLE_QUERIES);
}
