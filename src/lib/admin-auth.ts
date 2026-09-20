import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "lashmealex_admin_session";
const LOGIN_ATTEMPT_COOKIE_NAME = "lashmealex_admin_login_attempts";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export type AdminLoginResult = "ok" | "invalid" | "locked" | "unconfigured";

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  const paddedLeft = new Uint8Array(length);
  const paddedRight = new Uint8Array(length);
  paddedLeft.set(leftBytes);
  paddedRight.set(rightBytes);

  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1;
  for (let i = 0; i < length; i += 1) {
    mismatch |= paddedLeft[i]! ^ paddedRight[i]!;
  }
  return mismatch === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  return toHex(await crypto.subtle.digest("SHA-256", encoded));
}

async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET ?? null;
}

async function signPayload(secret: string, payload: string): Promise<string> {
  return hmacSha256Hex(secret, payload);
}

async function createSessionToken(password: string, secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const nonce = crypto.randomUUID();
  const passwordFingerprint = await sha256Hex(password);
  const payload = `v1.${expiresAt}.${nonce}.${passwordFingerprint}`;
  const mac = await signPayload(secret, payload);
  return `${payload}.${mac}`;
}

async function isValidSessionToken(
  token: string,
  password: string,
  secret: string,
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") {
    return false;
  }

  const [, expiresAtRaw, nonce, passwordFingerprint, mac] = parts;
  if (!expiresAtRaw || !nonce || !passwordFingerprint || !mac) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expectedFingerprint = await sha256Hex(password);
  if (!timingSafeEqualHex(passwordFingerprint, expectedFingerprint)) {
    return false;
  }

  const expectedMac = await signPayload(secret, `v1.${expiresAtRaw}.${nonce}.${passwordFingerprint}`);
  return timingSafeEqualHex(mac, expectedMac);
}

type LoginAttemptState = {
  count: number;
  resetAt: number;
};

async function readAttemptState(secret: string, raw: string | undefined): Promise<LoginAttemptState> {
  const empty: LoginAttemptState = { count: 0, resetAt: Date.now() + LOGIN_WINDOW_MS };
  if (!raw) return empty;

  const parts = raw.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return empty;

  const [, countRaw, resetAtRaw, mac] = parts;
  if (!countRaw || !resetAtRaw || !mac) return empty;

  const expectedMac = await signPayload(secret, `v1.${countRaw}.${resetAtRaw}`);
  if (!timingSafeEqualHex(mac, expectedMac)) return empty;

  const count = Number(countRaw);
  const resetAt = Number(resetAtRaw);
  if (!Number.isInteger(count) || count < 0 || !Number.isFinite(resetAt)) return empty;
  if (resetAt < Date.now()) return empty;

  return { count, resetAt };
}

async function writeAttemptCookie(secret: string, state: LoginAttemptState) {
  const payload = `v1.${state.count}.${state.resetAt}`;
  const mac = await signPayload(secret, payload);
  const cookieStore = await cookies();
  cookieStore.set(LOGIN_ATTEMPT_COOKIE_NAME, `${payload}.${mac}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: Math.max(60, Math.ceil((state.resetAt - Date.now()) / 1000)),
  });
}

async function clearAttemptCookie() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: LOGIN_ATTEMPT_COOKIE_NAME, path: "/admin" });
}

/**
 * Returns whether the request is authenticated as the owner admin user.
 *
 * @returns `true` when the admin cookie matches the configured credentials.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const password = getAdminPassword();
  const secret = getSessionSecret();

  if (!password || !secret) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return isValidSessionToken(token, password, secret);
}

/**
 * Redirects to the admin login page when the request is not authenticated.
 *
 * @throws Redirects to `/admin/login`.
 */
export async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }
}

/**
 * Attempts to sign an owner into the admin area.
 *
 * @param passwordInput The submitted admin password.
 * @returns A result describing success, invalid credentials, lockout, or missing config.
 */
export async function loginAdmin(passwordInput: string): Promise<AdminLoginResult> {
  const password = getAdminPassword();
  const secret = getSessionSecret();

  if (!password || !secret) {
    return "unconfigured";
  }

  const cookieStore = await cookies();
  const attemptState = await readAttemptState(
    secret,
    cookieStore.get(LOGIN_ATTEMPT_COOKIE_NAME)?.value,
  );

  if (attemptState.count >= MAX_LOGIN_ATTEMPTS) {
    return "locked";
  }

  const passwordHash = await sha256Hex(password);
  const inputHash = await sha256Hex(passwordInput);

  if (!timingSafeEqualHex(passwordHash, inputHash)) {
    const nextState: LoginAttemptState = {
      count: attemptState.count + 1,
      resetAt: attemptState.resetAt,
    };
    await writeAttemptCookie(secret, nextState);
    return nextState.count >= MAX_LOGIN_ATTEMPTS ? "locked" : "invalid";
  }

  await clearAttemptCookie();
  cookieStore.set(ADMIN_COOKIE_NAME, await createSessionToken(password, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return "ok";
}

/**
 * Clears the admin session cookie.
 */
export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
