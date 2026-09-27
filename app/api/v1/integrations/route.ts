import { isPandaScoreConfigured } from "@/lib/matches-service";
import { isEmailOtpEnabled, isGoogleOAuthEnabled, isSupabaseConfigured } from "@/lib/supabase-auth";
import { isReminderEmailConfigured } from "@/lib/reminder-mail";

export async function GET() {
  return Response.json({
    data: {
      pandascore: { configured: isPandaScoreConfigured() },
      supabaseAuth: {
        configured: isSupabaseConfigured(),
        googleOAuth: isGoogleOAuthEnabled(),
        emailOtp: isEmailOtpEnabled(),
      },
      reminders: { emailConfigured: isReminderEmailConfigured(), schedulerConfigured: Boolean(process.env.REMINDER_CRON_SECRET?.trim()) && process.env.REMINDER_SCHEDULER_ENABLED === "true" },
    },
  });
}
