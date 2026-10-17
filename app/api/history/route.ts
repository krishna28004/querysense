import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ error: "Server-side history has been retired. Saved work is stored in the visitor's browser." }, { status: 410 }); }
