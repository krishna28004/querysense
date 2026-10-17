import { NextResponse } from "next/server";
export function POST() { return NextResponse.json({ error: "Public query sharing has been retired. Use local report export." }, { status: 410 }); }
