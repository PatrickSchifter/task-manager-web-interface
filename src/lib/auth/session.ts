/**
 * session.ts — SERVER ONLY
 * Gerencia o cookie HttpOnly de autenticação.
 */

import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export async function setSessionToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearSessionToken() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
