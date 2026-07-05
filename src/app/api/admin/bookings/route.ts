import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings } from "@db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const result = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  return NextResponse.json(result);
}
