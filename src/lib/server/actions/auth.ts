"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { hashPassword, verifyPassword } from "../password";
import { signSessionToken } from "../session";
import { setSessionCookie, clearSessionCookie } from "../auth";
import { findUserByEmail, createUser } from "../queries/users";
import * as schema from "@db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(data: { email: string; password: string }) {
  const parsed = loginSchema.parse(data);
  const user = await findUserByEmail(parsed.email);
  if (!user) throw new Error("Invalid email or password");

  const valid = await verifyPassword(parsed.password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.id, user.id));

  const token = await signSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function signup(data: { name: string; email: string; password: string }) {
  const parsed = signupSchema.parse(data);
  const existing = await findUserByEmail(parsed.email);
  if (existing) throw new Error("Email already registered");

  const passwordHash = await hashPassword(parsed.password);
  const user = await createUser({
    email: parsed.email,
    passwordHash,
    name: parsed.name,
  });

  return { success: true };
}

export async function logout() {
  await clearSessionCookie();
  return { success: true };
}
