import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { addons } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const result = await db.select().from(addons).where(eq(addons.isActive, true));
  return NextResponse.json(result);
}
