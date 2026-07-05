import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — BeeVelt Halls",
  description: "Sign in to your BeeVelt Halls account to manage bookings",
};

export default function LoginPage() {
  return <LoginForm />;
}
