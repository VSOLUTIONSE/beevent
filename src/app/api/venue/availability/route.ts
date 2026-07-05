import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { bookings, blockedDates } from "@db/schema";
import { and, gte, lte, notInArray } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "start and end required" }, { status: 400 });

  const db = getDb();
  const startDate = new Date(start);
  const endDate = new Date(end);

  const conflicts = await db
    .select()
    .from(bookings)
    .where(
      and(
        notInArray(bookings.status, [
          "cancelled_by_customer", "cancelled_by_staff", "rejected",
        ]),
        lte(bookings.eventStart, endDate),
        gte(bookings.eventEnd, startDate),
      )
    )
    .limit(1);

  const blocks = await db
    .select()
    .from(blockedDates)
    .where(
      and(
        lte(blockedDates.blockStart, endDate.toISOString().split("T")[0]),
        gte(blockedDates.blockEnd, startDate.toISOString().split("T")[0]),
      )
    )
    .limit(1);

  return NextResponse.json({
    available: conflicts.length === 0 && blocks.length === 0,
    conflicts: conflicts.length > 0,
    blocked: blocks.length > 0,
  });
}
