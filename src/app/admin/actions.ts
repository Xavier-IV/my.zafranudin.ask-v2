"use server";

import pb from "@/lib/pocketbase";
import { setSession, clearSession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";

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
}

export async function getAdminEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.email || null;
}
