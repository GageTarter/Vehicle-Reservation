import { OAuth2Client } from "google-auth-library";
import authConfig from "../config/auth.config.js";

const validIssuers = new Set(["https://accounts.google.com", "accounts.google.com"]);

export async function verifyGoogleIdToken(idToken) {
  const client = new OAuth2Client(authConfig.googleClientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: authConfig.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload || !validIssuers.has(payload.iss)) {
    throw new Error("Invalid Google token issuer.");
  }

  return payload;
}
