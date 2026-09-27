import {
  createSessionFromOAuthTokens,
  isGoogleOAuthEnabled,
  sessionCookieHeaders,
} from "@/lib/supabase-auth";

export async function POST(request: Request) {
  if (!isGoogleOAuthEnabled()) {
    return Response.json({ error: "google_login_not_configured" }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  };
  const accessToken = body.accessToken?.trim();
  const refreshToken = body.refreshToken?.trim();
  if (!accessToken || !refreshToken || accessToken.length > 8192 || refreshToken.length > 8192) {
    return Response.json({ error: "invalid_oauth_session" }, { status: 400 });
  }
  try {
    const session = await createSessionFromOAuthTokens(
      accessToken,
      refreshToken,
      Number(body.expiresIn) || 3600,
    );
    const response = Response.json({ data: { signedIn: true } });
    for (const cookie of sessionCookieHeaders(session)) response.headers.append("set-cookie", cookie);
    return response;
  } catch {
    return Response.json({ error: "invalid_oauth_session" }, { status: 401 });
  }
}
