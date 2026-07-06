import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — BeeVent Halls",
  description: "Sign in to your BeeVent Halls account to manage bookings",
};

export default function LoginPage() {
  return <LoginForm />;
}
