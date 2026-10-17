import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ error: "Server-side history is no longer available." }, { status: 410 }); }
