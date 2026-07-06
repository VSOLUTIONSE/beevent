import type { Metadata } from "next";
import BookingWizard from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book - BeeVent Halls",
  description: "Book BeeVent Halls for your next event",
};

export default function BookPage() {
  return <BookingWizard />;
}
