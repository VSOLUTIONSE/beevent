import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — BeeVelt Halls",
  description: "Create a BeeVelt Halls account to book our premium event venue",
};

export default function SignupPage() {
  return <SignupForm />;
}
