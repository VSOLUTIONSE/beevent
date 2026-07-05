"use server";

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { blockedDates } from "@db/schema";

export async function blockDate(input: {
  blockStart: string;
  blockEnd: string;
  reason?: string;
  showAsUnavailable?: boolean;
}) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.insert(blockedDates).values({
    blockStart: input.blockStart,
    blockEnd: input.blockEnd,
    reason: input.reason,
    showAsUnavailable: input.showAsUnavailable ?? true,
    createdBy: user.id,
  });
  return { success: true };
}

export async function unblockDate(id: number) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.delete(blockedDates).where(eq(blockedDates.id, id));
  return { success: true };
}
