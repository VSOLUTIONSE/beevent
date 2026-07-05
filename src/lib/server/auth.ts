import { cookies } from "next/headers";
import { verifySessionToken, signSessionToken } from "./session";
import { findUserById } from "./queries/users";
import type { User } from "@db/schema";
import { Session } from "@contracts/constants";

export async function getAuthUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(Session.cookieName)?.value;
  if (!token) return null;

  const claim = await verifySessionToken(token);
  if (!claim) return null;

  const user = await findUserById(claim.userId);
  return user ?? null;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(Session.cookieName, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Session.maxAgeMs / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(Session.cookieName, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
