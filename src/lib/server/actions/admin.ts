"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { bookings, users } from "@db/schema";

export async function approveBooking(id: number) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, id));
  return { success: true };
}

export async function rejectBooking(id: number, reason?: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.update(bookings).set({ status: "rejected" }).where(eq(bookings.id, id));
  return { success: true };
}

const updateRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["user", "staff", "manager", "accountant", "admin"]),
});

export async function updateStaffRole(input: z.infer<typeof updateRoleSchema>) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const parsed = updateRoleSchema.parse(input);
  const db = getDb();
  await db.update(users).set({ role: parsed.role }).where(eq(users.id, parsed.userId));
  return { success: true };
}
