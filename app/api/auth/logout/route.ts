import {
  clearSessionCookieHeaders,
  getAccessTokenCookie,
  signOutSupabaseSession,
} from "@/lib/supabase-auth";

export async function POST() {
  await signOutSupabaseSession(await getAccessTokenCookie());
  const response = Response.json({ data: { signedOut: true } });
  for (const cookie of clearSessionCookieHeaders()) response.headers.append("set-cookie", cookie);
  return response;
}
