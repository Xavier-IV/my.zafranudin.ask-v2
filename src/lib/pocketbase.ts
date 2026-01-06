import "server-only";
import PocketBase from "pocketbase";
import { isPocketBaseAuthError, handleAuthError } from "./pocketbase-errors";

const pb = new PocketBase(
  process.env.POCKETBASE_URL || "http://127.0.0.1:8090"
);

// Add the secret key to the headers if it exists
pb.beforeSend = function (url, options) {
  if (process.env.POCKETBASE_SECRET_KEY) {
    options.headers = Object.assign({}, options.headers, {
      "x-secret-key": process.env.POCKETBASE_SECRET_KEY,
    });
  }
  return { url, options };
};

export function getAuthenticatedPb(token: string): PocketBase {
  const authPb = new PocketBase(
    process.env.POCKETBASE_URL || "http://127.0.0.1:8090"
  );
  authPb.authStore.save(token, null);
  return authPb;
}

/**
 * Wraps an async function that makes PocketBase API calls and handles auth errors
 * If a 401 or 403 error is caught, it clears the session and redirects to login
 * @param fn - The async function to wrap
 * @returns The result of the function, or redirects to login on auth error
 */
export async function withAuthErrorHandler<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isPocketBaseAuthError(error)) {
      await handleAuthError("expired");
    }
    throw error;
  }
}

export default pb;
