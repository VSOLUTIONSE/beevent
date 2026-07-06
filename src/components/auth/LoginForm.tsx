"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/server/actions/auth";
import { GlassCard, FormField, FormInput, PillButton } from "@/design/primitives";

export default function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("signup=success")) {
      toast.success("Account created! Please sign in.");
    }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await login({
          email: form.get("email") as string,
          password: form.get("password") as string,
        });
        toast.success("Signed in successfully!");
        router.push("/");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Login failed");
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
            <h1 className="font-serif text-3xl text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-[#B0A8A8]">Sign in to access your dashboard and manage bookings</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Email">
              <FormInput name="email" type="email" required placeholder="you@example.com" />
            </FormField>
            <FormField label="Password">
              <div className="relative">
                <FormInput name="password" type={showPassword ? "text" : "password"} required placeholder="Enter your password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <PillButton type="submit" disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" />Sign In</>
              )}
            </PillButton>
          </form>

          <p className="text-xs text-center text-[#B0A8A8] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#829796] hover:underline">Sign up</Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
