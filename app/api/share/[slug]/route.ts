import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ error: "Public query sharing is no longer available." }, { status: 410 }); }
