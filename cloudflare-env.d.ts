declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PANDASCORE_TOKEN?: string;
    RESEND_API_KEY?: string;
    REMINDER_FROM_EMAIL?: string;
    REMINDER_CRON_SECRET?: string;
    REMINDER_SCHEDULER_ENABLED?: string;
    SITE_URL?: string;
    TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  }
}
