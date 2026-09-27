import { requestEmailOtp, isEmailOtpEnabled } from "@/lib/supabase-auth";
import { verifyTurnstile } from "@/lib/turnstile";

const recentRequests = new Map<string, number>();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!isEmailOtpEnabled()) {
    return Response.json({ error: "email_login_not_configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; captchaToken?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const remoteIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!await verifyTurnstile(body.captchaToken, remoteIp)) return Response.json({ error: "captcha_required" }, { status: 400 });

  const key = await throttleKey(request, email);
  const lastRequest = recentRequests.get(key) ?? 0;
  if (Date.now() - lastRequest < 60_000) {
    return Response.json({ error: "otp_rate_limited", retryAfter: 60 }, { status: 429 });
  }
  recentRequests.set(key, Date.now());

  try {
    await requestEmailOtp(email);
    return Response.json({ data: { sent: true, retryAfter: 60 } });
  } catch (error) {
    return Response.json(
      { error: "otp_request_failed", message: safeError(error) },
      { status: 502 },
    );
  }
}

async function throttleKey(request: Request, email: string) {
  const forwarded = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const input = new TextEncoder().encode(`${email}|${forwarded.split(",")[0]}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function safeError(error: unknown) {
  return (error instanceof Error ? error.message : "邮件发送失败").slice(0, 160);
}
