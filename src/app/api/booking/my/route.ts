import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.createdAt));

  return NextResponse.json(result);
}
