import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { users } from "@db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(sql`${users.role} IN ('staff', 'manager', 'accountant', 'admin')`);

  return NextResponse.json(result);
}
