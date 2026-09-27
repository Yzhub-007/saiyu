import { isSupabaseConfigured, sessionCookieHeaders, verifyEmailOtp } from "@/lib/supabase-auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "email_login_not_configured" }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string; token?: string };
  const email = body.email?.trim().toLowerCase();
  const token = body.token?.trim();
  if (!email || !EMAIL_PATTERN.test(email) || !token || !/^\d{6,10}$/.test(token)) {
    return Response.json({ error: "invalid_otp_payload" }, { status: 400 });
  }

  try {
    const session = await verifyEmailOtp(email, token);
    const response = Response.json({ data: { signedIn: true, email: session.user.email ?? email } });
    for (const cookie of sessionCookieHeaders(session)) response.headers.append("set-cookie", cookie);
    return response;
  } catch (error) {
    return Response.json(
      { error: "otp_verification_failed", message: safeError(error) },
      { status: 401 },
    );
  }
}

function safeError(error: unknown) {
  return (error instanceof Error ? error.message : "验证码无效或已过期").slice(0, 160);
}
