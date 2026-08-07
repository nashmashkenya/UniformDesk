import { SignJWT, jwtVerify } from "jose";

/** Cookie name — shared by auth helpers and edge middleware. */
export const SESSION_COOKIE = "ud_session";

export function authSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecretKey());
}

/** Edge-safe JWT check (no DB). Returns user id or null. */
export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}
