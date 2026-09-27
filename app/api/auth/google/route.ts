import {
  getGoogleOAuthUrl,
  isGoogleOAuthEnabled,
  safeRelativePath,
} from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!isGoogleOAuthEnabled()) {
    return Response.redirect(new URL("/account?auth=google_not_configured", url.origin), 303);
  }
  const next = safeRelativePath(url.searchParams.get("next"));
  return Response.redirect(getGoogleOAuthUrl(request, next), 303);
}
