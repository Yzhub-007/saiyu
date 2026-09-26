declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PANDASCORE_TOKEN?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  }
}
