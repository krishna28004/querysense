import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ status: "ok", service: "querysense" }, { headers: { "Cache-Control": "no-store" } }); }
