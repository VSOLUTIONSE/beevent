import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account - BeeVent Halls",
  description: "Create a BeeVent Halls account to book our premium event venue",
};

export default function SignupPage() {
  return <SignupForm />;
}
