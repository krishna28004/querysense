import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", database: "connected" });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", database: "disconnected", error: String(error) },
      { status: 500 }
    );
  }
}
