import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { payments } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.json({ status: "not_found" });

  const db = getDb();
  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.providerRef, reference))
    .limit(1);

  if (!result[0]) return NextResponse.json({ status: "not_found" });
  return NextResponse.json({ status: result[0].status, payment: result[0] });
}
