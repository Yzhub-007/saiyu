import {
  getRefreshTokenCookie,
  getSupabaseUserFromCookies,
  isSupabaseConfigured,
  refreshSupabaseSession,
  sessionCookieHeaders,
} from "@/lib/supabase-auth";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({ data: { configured: false, signedIn: false, refreshed: false } });
  }
  const user = await getSupabaseUserFromCookies();
  if (user) {
    return Response.json({ data: { configured: true, signedIn: true, refreshed: false } });
  }
  const refreshToken = await getRefreshTokenCookie();
  if (!refreshToken) {
    return Response.json({ data: { configured: true, signedIn: false, refreshed: false } });
  }
  try {
    const session = await refreshSupabaseSession(refreshToken);
    const response = Response.json({ data: { configured: true, signedIn: true, refreshed: true } });
    for (const cookie of sessionCookieHeaders(session)) response.headers.append("set-cookie", cookie);
    return response;
  } catch {
    return Response.json({ data: { configured: true, signedIn: false, refreshed: false } });
  }
}
