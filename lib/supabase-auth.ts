import { cookies } from "next/headers";

const ACCESS_COOKIE = "saiyu-sb-access";
const REFRESH_COOKIE = "saiyu-sb-refresh";

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: { provider?: string };
  user_metadata?: { full_name?: string; name?: string };
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SupabaseUser;
};

export function isSupabaseConfigured() {
  return Boolean(getConfig());
}

export function isEmailOtpEnabled() {
  return isSupabaseConfigured() && process.env.EMAIL_OTP_ENABLED?.trim().toLowerCase() === "true";
}

export function isGoogleOAuthEnabled() {
  return isSupabaseConfigured() && process.env.GOOGLE_OAUTH_ENABLED?.trim().toLowerCase() === "true";
}

export function getGoogleOAuthUrl(request: Request, next = "/account") {
  const config = requireConfig();
  const siteUrl = trustedSiteUrl(request);
  const callback = new URL("/auth/callback", siteUrl);
  callback.searchParams.set("next", safeRelativePath(next));
  const authorize = new URL(`${config.url}/auth/v1/authorize`);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", callback.toString());
  return authorize.toString();
}

export async function requestEmailOtp(email: string) {
  const config = requireConfig();
  const response = await fetch(`${config.url}/auth/v1/otp`, {
    method: "POST",
    headers: authHeaders(config.key),
    body: JSON.stringify({ email, create_user: true }),
  });
  await assertOk(response, "otp_request_failed");
}

export async function verifyEmailOtp(email: string, token: string): Promise<SupabaseSession> {
  const config = requireConfig();
  const response = await fetch(`${config.url}/auth/v1/verify`, {
    method: "POST",
    headers: authHeaders(config.key),
    body: JSON.stringify({ email, token, type: "email" }),
  });
  await assertOk(response, "otp_verification_failed");
  return (await response.json()) as SupabaseSession;
}

export async function createSessionFromOAuthTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
): Promise<SupabaseSession> {
  const config = requireConfig();
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.key, authorization: `Bearer ${accessToken}` },
  });
  await assertOk(response, "oauth_session_invalid");
  const user = (await response.json()) as SupabaseUser;
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Math.min(Math.max(60, expiresIn || 3600), 60 * 60 * 24),
    user,
  };
}

export async function refreshSupabaseSession(refreshToken: string): Promise<SupabaseSession> {
  const config = requireConfig();
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(config.key),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  await assertOk(response, "session_refresh_failed");
  return (await response.json()) as SupabaseSession;
}

export async function getSupabaseUserFromCookies(): Promise<SupabaseUser | null> {
  const config = getConfig();
  if (!config) return null;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.key, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as SupabaseUser;
}

export async function signOutSupabaseSession(accessToken?: string) {
  const config = getConfig();
  if (!config || !accessToken) return;
  await fetch(`${config.url}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: config.key, authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined);
}

export async function getAccessTokenCookie() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshTokenCookie() {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export function sessionCookieHeaders(session: SupabaseSession) {
  const accessMaxAge = Math.max(60, session.expires_in || 3600);
  return [
    serializeCookie(ACCESS_COOKIE, session.access_token, accessMaxAge),
    serializeCookie(REFRESH_COOKIE, session.refresh_token, 60 * 60 * 24 * 30),
  ];
}

export function clearSessionCookieHeaders() {
  return [
    serializeCookie(ACCESS_COOKIE, "", 0),
    serializeCookie(REFRESH_COOKIE, "", 0),
  ];
}

function getConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  return url && key ? { url, key } : null;
}

function requireConfig() {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");
  return config;
}

function trustedSiteUrl(request: Request) {
  const configured = process.env.SITE_URL?.trim();
  if (configured) return new URL(configured);
  return new URL(request.url).origin;
}

export function safeRelativePath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

function authHeaders(key: string) {
  return { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };
}

async function assertOk(response: Response, fallback: string) {
  if (response.ok) return;
  let message = fallback;
  try {
    const body = (await response.json()) as { error_description?: string; msg?: string; error?: string };
    message = body.error_description ?? body.msg ?? body.error ?? fallback;
  } catch {
    // Preserve the stable fallback when the upstream response is not JSON.
  }
  throw new Error(message.slice(0, 160));
}

function serializeCookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
