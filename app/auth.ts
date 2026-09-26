import { getChatGPTUser } from "./chatgpt-auth";
import { getSupabaseUserFromCookies } from "@/lib/supabase-auth";

export type CurrentUser = {
  userId: string;
  displayName: string;
  email: string;
  authProvider: "supabase" | "site-owner";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabaseUser = await getSupabaseUserFromCookies();
  if (supabaseUser?.email) {
    return {
      userId: `supabase:${supabaseUser.id}`,
      displayName:
        supabaseUser.user_metadata?.full_name ??
        supabaseUser.user_metadata?.name ??
        supabaseUser.email,
      email: supabaseUser.email,
      authProvider: "supabase",
    };
  }

  const siteUser = await getChatGPTUser();
  if (!siteUser) return null;
  return {
    userId: `site:${siteUser.userId}`,
    displayName: siteUser.displayName,
    email: siteUser.email,
    authProvider: "site-owner",
  };
}
