"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, ArrowLeft, Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/server/actions/auth";
import { GlassCard, FormField, FormInput, PillButton } from "@/design/primitives";
import { cn } from "@/lib/utils";

type FieldErrors = {
  email?: string;
  password?: string;
};

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.includes("@") || !email.includes(".")) {
    errors.email = "Please enter a valid email address";
  }
  if (!password) {
    errors.password = "Password is required";
  }
  return errors;
}

export default function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.search.includes("signup=success")) {
      toast.success("Account created! Please sign in.");
    }
  }, []);

  function clearField(name: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    startTransition(async () => {
      const result = await login({ email, password });
      if (!result.success) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Signed in successfully!");
      router.push("/");
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

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField label="Email">
              <FormInput
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                onChange={() => clearField("email")}
                className={cn(fieldErrors.email && "border-red-500/50 focus:border-red-500")}
              />
              {fieldErrors.email && (
                <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </FormField>

            <FormField label="Password">
              <div className="relative">
                <FormInput
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  className={cn("pr-10", fieldErrors.password && "border-red-500/50 focus:border-red-500")}
                  onChange={() => clearField("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </FormField>

            {serverError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

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
