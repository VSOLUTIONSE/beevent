import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings, payments } from "@db/schema";
import { eq, sql, count, and, gte } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();

  const revenueResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.status, "successful"));

  const bookingsCount = await db.select({ count: count() }).from(bookings);
  const pendingCount = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "pending_approval"));

  const upcomingCount = await db
    .select({ count: count() })
    .from(bookings)
    .where(and(eq(bookings.status, "confirmed"), gte(bookings.eventStart, new Date())));

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyRevenue = await db
    .select({
      month: sql<string>`to_char(${payments.initiatedAt}, 'YYYY-MM')`,
      total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(and(eq(payments.status, "successful"), gte(payments.initiatedAt, sixMonthsAgo)))
    .groupBy(sql`to_char(${payments.initiatedAt}, 'YYYY-MM')`);

  return NextResponse.json({
    totalRevenue: revenueResult[0]?.total ?? 0,
    totalBookings: bookingsCount[0]?.count ?? 0,
    pendingApprovals: pendingCount[0]?.count ?? 0,
    upcomingEvents: upcomingCount[0]?.count ?? 0,
    monthlyRevenue,
  });
}
