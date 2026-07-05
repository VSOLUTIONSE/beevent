import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { packages } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const result = await db.select().from(packages).where(eq(packages.isActive, true));
  return NextResponse.json(result);
}
