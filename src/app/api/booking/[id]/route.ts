import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings, bookingAddons } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const bookingId = parseInt(id);
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!result[0]) return NextResponse.json(null);
  if (result[0].userId !== user.id && user.role === "user") {
    return NextResponse.json(null);
  }

  const bAddons = await db
    .select()
    .from(bookingAddons)
    .where(eq(bookingAddons.bookingId, bookingId));

  return NextResponse.json({ ...result[0], addons: bAddons });
}
