import type { Metadata } from "next";
import BookingWizard from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book — BeeVelt Halls",
  description: "Book BeeVelt Halls for your next event",
};

export default function BookPage() {
  return <BookingWizard />;
}
