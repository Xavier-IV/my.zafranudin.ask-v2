import { ClientResponseError } from "pocketbase";
import { redirect } from "next/navigation";
import { clearSession } from "./session";

/**
 * Re-export ClientResponseError for type checking
 */
export { ClientResponseError };

/**
 * Check if an error is a PocketBase authentication error (401 or 403)
 */
export function isPocketBaseAuthError(error: unknown): boolean {
  if (error instanceof ClientResponseError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
}

/**
 * Handle PocketBase authentication errors by clearing session and redirecting to login
 * @param reason - Optional reason for the auth error (e.g., "expired")
 */
export async function handleAuthError(reason: string = "expired"): Promise<never> {
  await clearSession();
  redirect(`/admin/login?reason=${reason}`);
}
