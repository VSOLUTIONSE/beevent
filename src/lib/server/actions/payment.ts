"use server";

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { payments, bookings } from "@db/schema";

export async function initiatePayment(bookingId: number) {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");

  const db = getDb();
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking[0] || booking[0].userId !== user.id) {
    throw new Error("Booking not found");
  }

  const providerRef = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  await db.insert(payments).values({
    bookingId,
    provider: "paystack",
    providerRef,
    amount: booking[0].total,
    currency: "NGN",
    status: "initiated",
  });

  return {
    providerRef,
    amount: booking[0].total,
    authorizationUrl: `/api/payments/mock-callback?ref=${providerRef}`,
  };
}

export async function mockPaymentCallback(ref: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.providerRef, ref))
    .limit(1);

  if (result[0]) {
    await db
      .update(payments)
      .set({ status: "successful", completedAt: new Date() })
      .where(eq(payments.id, result[0].id));

    await db
      .update(bookings)
      .set({ status: "confirmed" })
      .where(eq(bookings.id, result[0].bookingId));

    return { success: true, message: "Payment verified" };
  }

  return { success: false, message: "Payment not found" };
}
