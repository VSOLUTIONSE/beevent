"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import { signup } from "@/lib/server/actions/auth";
import { GlassCard, FormField, FormInput, PillButton } from "@/design/primitives";

export default function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await signup({
          name: form.get("name") as string,
          email: form.get("email") as string,
          password: form.get("password") as string,
        });
        router.push("/book");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Signup failed");
      }
    });
  }

  return (
    <div className="relative min-h-screen bg-[#030305] flex items-center justify-center">
      <div className="absolute inset-0">
        <img src="/images/hero-hall.jpg" alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/80 to-[#030305]/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#B0A8A8] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <GlassCard strong className="p-8 lg:p-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-white mb-2">Create Account</h1>
            <p className="text-sm text-[#B0A8A8]">Sign up to start booking events at BeeVelt Halls</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Name">
              <FormInput name="name" required placeholder="Your name" />
            </FormField>
            <FormField label="Email">
              <FormInput name="email" type="email" required placeholder="you@example.com" />
            </FormField>
            <FormField label="Password">
              <FormInput name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
            </FormField>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <PillButton type="submit" disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><UserPlus className="w-4 h-4" />Create Account</>
              )}
            </PillButton>
          </form>

          <p className="text-xs text-center text-[#B0A8A8] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#829796] hover:underline">Sign in</Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
