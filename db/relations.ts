import { relations } from "drizzle-orm";
import {
  users,
  venue,
  packages,
  addons,
  bookings,
  bookingAddons,
  blockedDates,
  payments,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  blockedDates: many(blockedDates),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  bookings: many(bookings),
}));

export const addonsRelations = relations(addons, ({ many }) => ({
  bookingAddons: many(bookingAddons),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  package: one(packages, { fields: [bookings.packageId], references: [packages.id] }),
  bookingAddons: many(bookingAddons),
  payments: many(payments),
}));

export const bookingAddonsRelations = relations(bookingAddons, ({ one }) => ({
  booking: one(bookings, { fields: [bookingAddons.bookingId], references: [bookings.id] }),
  addon: one(addons, { fields: [bookingAddons.addonId], references: [addons.id] }),
}));

export const blockedDatesRelations = relations(blockedDates, ({ one }) => ({
  createdByUser: one(users, { fields: [blockedDates.createdBy], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));
