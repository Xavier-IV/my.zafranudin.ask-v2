"use server";

import { cookies } from "next/headers";
import { createHmac } from "crypto";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Use a secret for signing. Fallback to POCKETBASE_SECRET_KEY if available.
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.POCKETBASE_SECRET_KEY || "fallback-secret-please-set-session-secret";

export interface AdminSession {
  token: string;
  email: string;
  expiresAt: number;
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function verify(payload: string, signature: string): boolean {
  const expectedSignature = sign(payload);
  return expectedSignature === signature;
}

export async function setSession(session: AdminSession): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify(session);
  const signature = sign(payload);
  
  // Combine payload and signature
  const value = `${payload}.${signature}`;

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    // Session format is: JSON_PAYLOAD.HMAC_SIGNATURE
    // Use lastIndexOf because the JWT token inside the JSON contains dots
    const dotIndex = sessionCookie.value.lastIndexOf(".");
    if (dotIndex === -1) {
      console.warn("Invalid session format - no signature found");
      return null;
    }
    
    const payload = sessionCookie.value.substring(0, dotIndex);
    const signature = sessionCookie.value.substring(dotIndex + 1);
    
    if (!payload || !signature || !verify(payload, signature)) {
      console.warn("Invalid session signature detected");
      return null;
    }

    const session: AdminSession = JSON.parse(payload);

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error parsing session cookie:", error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function hasValidSession(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

