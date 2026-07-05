import type { Metadata } from "next";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — BeeVelt Halls",
  description: "Manage your bookings and venue schedule",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
