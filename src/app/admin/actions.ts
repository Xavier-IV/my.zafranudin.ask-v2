"use server";

import pb, { getAuthenticatedPb } from "@/lib/pocketbase";
import { setSession, clearSession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isPocketBaseAuthError, handleAuthError } from "@/lib/pocketbase-errors";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  message: string;
  error?: string;
};

export async function loginAdmin(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);

  if (!validation.success) {
    return { message: "", error: validation.error.issues[0].message };
  }

  try {
    // Authenticate with PocketBase admins collection
    const authData = await pb.admins.authWithPassword(
      validation.data.email,
      validation.data.password
    );

    // Create session
    await setSession({
      token: authData.token,
      email: authData.record.email,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  } catch (error) {
    console.error("Login error:", error);
    return { message: "", error: "Invalid email or password" };
  }

  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  await clearSession();
  redirect("/admin/login");
}

export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Proactively validate the token with PocketBase to catch expired sessions
  try {
    const authenticatedPb = getAuthenticatedPb(session.token);
    // Make a lightweight API call to verify the token is still valid
    // This will throw a 401/403 error if the token is expired/invalid
    await authenticatedPb.admins.authRefresh();
  } catch (error) {
    console.error("Token validation error:", error);
    if (isPocketBaseAuthError(error)) {
      await handleAuthError("expired");
    }
    // If it's not an auth error, rethrow it
    throw error;
  }
}

export async function getAdminEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.email || null;
}
