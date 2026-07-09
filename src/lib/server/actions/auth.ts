"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { hashPassword, verifyPassword } from "../password";
import { signSessionToken } from "../session";
import { setSessionCookie, clearSessionCookie } from "../auth";
import { findUserByEmail, createUser } from "../queries/users";
import * as schema from "@db/schema";
import type { ActionResult } from "@contracts/types";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type LoginResult = {
  user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  };
};

export async function login(
  data: { email: string; password: string },
): Promise<ActionResult<LoginResult>> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.id, user.id));

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
  });
  await setSessionCookie(token);

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  };
}

export async function signup(
  data: { name: string; email: string; password: string },
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return { success: false, error: "Email already registered" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await createUser({
    email: parsed.data.email,
    passwordHash,
    name: parsed.data.name,
  });

  return { success: true };
}

export async function logout() {
  await clearSessionCookie();
  return { success: true };
}
