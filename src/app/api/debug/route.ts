import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.AUTH_SECRET = process.env.AUTH_SECRET ? "set" : "MISSING";
  checks.AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST ?? "NOT SET";

  // Check DB connection
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.database = "connected";
  } catch (error) {
    checks.database = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }

  // Check if User table exists
  try {
    const count = await prisma.user.count();
    checks.userTable = `exists (${count} rows)`;
  } catch (error) {
    checks.userTable = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }

  return NextResponse.json(checks, { status: 200 });
}
