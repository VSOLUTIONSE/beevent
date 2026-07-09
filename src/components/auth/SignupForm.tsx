"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, ArrowLeft, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { signup } from "@/lib/server/actions/auth";
import { GlassCard, FormField, FormInput, PillButton } from "@/design/primitives";
import { cn } from "@/lib/utils";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) {
    errors.name = "Name is required";
  }
  if (!email.includes("@") || !email.includes(".")) {
    errors.email = "Please enter a valid email address";
  }
  if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  return errors;
}

export default function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function clearField(name: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;

    const errors = validate(name, email, password);
    setFieldErrors(errors);
    if (errors.name || errors.email || errors.password) return;

    startTransition(async () => {
      const result = await signup({ name, email, password });
      if (!result.success) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Account created! Please sign in.");
      router.push("/login");
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
            <p className="text-sm text-[#B0A8A8]">Sign up to start booking events at BeeVent Halls</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField label="Name">
              <FormInput
                name="name"
                required
                placeholder="Your name"
                onChange={() => clearField("name")}
                className={cn(fieldErrors.name && "border-red-500/50 focus:border-red-500")}
              />
              {fieldErrors.name && (
                <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.name}
                </p>
              )}
            </FormField>

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
                  minLength={6}
                  placeholder="At least 6 characters"
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
