import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { venue } from "@db/schema";

export async function GET() {
  const db = getDb();
  const result = await db.select().from(venue).limit(1);
  return NextResponse.json(result[0] ?? null);
}
