import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import VenueSection from "@/components/sections/VenueSection";
import PackagesSection from "@/components/sections/PackagesSection";
import CalendarPreview from "@/components/sections/CalendarPreview";

export const metadata: Metadata = {
  title: "BeeVelt Halls — Premium Event Venue in Lagos",
  description:
    "An architectural masterpiece in the heart of Lagos. Book BeeVelt Halls for weddings, galas, conferences, and celebrations.",
  openGraph: {
    title: "BeeVelt Halls",
    description: "Premium event venue booking platform in Lagos, Nigeria",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <VenueSection />
      <PackagesSection />
      <CalendarPreview />
    </>
  );
}
