import "server-only";
import PocketBase from "pocketbase";

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

export default pb;
