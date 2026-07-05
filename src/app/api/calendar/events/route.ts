import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings, blockedDates } from "@db/schema";
import { and, gte, lte, notInArray } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") || "0");
  const year = parseInt(searchParams.get("year") || "0");
  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  const db = getDb();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const bookingEvents = await db
    .select()
    .from(bookings)
    .where(
      and(
        notInArray(bookings.status, [
          "cancelled_by_customer", "cancelled_by_staff", "rejected",
        ]),
        lte(bookings.eventStart, endOfMonth),
        gte(bookings.eventEnd, startOfMonth),
      )
    );

  const blocked = await db
    .select()
    .from(blockedDates)
    .where(
      and(
        lte(blockedDates.blockStart, endOfMonth.toISOString().split("T")[0]),
        gte(blockedDates.blockEnd, startOfMonth.toISOString().split("T")[0]),
      )
    );

  return NextResponse.json({ bookings: bookingEvents, blocked });
}
