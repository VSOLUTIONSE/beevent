"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { bookings, bookingAddons, packages, addons } from "@db/schema";

function generateBookingRef(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `VH-${year}-${random}`;
}

const createBookingSchema = z.object({
  eventName: z.string().min(1),
  eventType: z.enum([
    "wedding", "birthday", "conference", "church",
    "corporate", "seminar", "concert", "party", "other",
  ]),
  guestCount: z.number().min(1),
  packageId: z.number(),
  eventStart: z.string(),
  eventEnd: z.string(),
  specialRequests: z.string().optional(),
  addonIds: z.array(z.number()).optional(),
});

export async function createBooking(input: z.infer<typeof createBookingSchema>) {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");

  const parsed = createBookingSchema.parse(input);
  const db = getDb();

  const pkg = await db
    .select()
    .from(packages)
    .where(eq(packages.id, parsed.packageId))
    .limit(1);
  if (!pkg[0]) throw new Error("Package not found");

  let subtotal = parseFloat(pkg[0].price);
  const addonPrices: { addonId: number; price: number }[] = [];

  if (parsed.addonIds && parsed.addonIds.length > 0) {
    for (const addonId of parsed.addonIds) {
      const addon = await db
        .select()
        .from(addons)
        .where(eq(addons.id, addonId))
        .limit(1);
      if (addon[0]) {
        const price = parseFloat(addon[0].price);
        subtotal += price;
        addonPrices.push({ addonId, price: parseFloat(price.toFixed(2)) });
      }
    }
  }

  const bookingRef = generateBookingRef();
  const result = await db.insert(bookings).values({
    bookingRef,
    userId: user.id,
    eventName: parsed.eventName,
    eventType: parsed.eventType,
    guestCount: parsed.guestCount,
    packageId: parsed.packageId,
    eventStart: new Date(parsed.eventStart),
    eventEnd: new Date(parsed.eventEnd),
    setupStart: new Date(new Date(parsed.eventStart).getTime() - 2 * 60 * 60 * 1000),
    teardownEnd: new Date(new Date(parsed.eventEnd).getTime() + 2 * 60 * 60 * 1000),
    specialRequests: parsed.specialRequests,
    subtotal: subtotal.toFixed(2),
    total: subtotal.toFixed(2),
    status: "pending_payment",
  }).returning();

  const bookingId = result[0].id;
  for (const ao of addonPrices) {
    await db.insert(bookingAddons).values({
      bookingId,
      addonId: ao.addonId,
      price: ao.price.toFixed(2),
    });
  }

  return { bookingId, bookingRef, total: subtotal };
}

export async function cancelBooking(id: number) {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");

  const db = getDb();
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!result[0] || result[0].userId !== user.id) {
    throw new Error("Booking not found");
  }

  await db
    .update(bookings)
    .set({ status: "cancelled_by_customer" })
    .where(eq(bookings.id, id));

  return { success: true };
}
