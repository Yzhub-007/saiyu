import { isPandaScoreConfigured } from "@/lib/matches-service";
import { isSupabaseConfigured } from "@/lib/supabase-auth";

export async function GET() {
  return Response.json({
    data: {
      pandascore: { configured: isPandaScoreConfigured() },
      supabaseAuth: { configured: isSupabaseConfigured(), flow: "email_otp" },
    },
  });
}
