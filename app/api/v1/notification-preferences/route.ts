import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { notificationPreferences } from "@/db/schema";

const defaults = { inAppEnabled: true, emailEnabled: true, reminder24h: true, reminder15m: true, timezone: "Asia/Shanghai" };

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  try {
    const [row] = await getDb().select().from(notificationPreferences).where(eq(notificationPreferences.userId, user.userId)).limit(1);
    return Response.json({ data: row ?? defaults });
  } catch {
    return Response.json({ data: defaults, meta: { persisted: false } });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const input = await request.json() as Partial<typeof defaults>;
  const data = {
    userId: user.userId,
    inAppEnabled: input.inAppEnabled ?? defaults.inAppEnabled,
    emailEnabled: input.emailEnabled ?? defaults.emailEnabled,
    reminder24h: input.reminder24h ?? defaults.reminder24h,
    reminder15m: input.reminder15m ?? defaults.reminder15m,
    timezone: typeof input.timezone === "string" && input.timezone.length < 64 ? input.timezone : defaults.timezone,
    updatedAt: new Date().toISOString(),
  };
  try {
    await getDb().insert(notificationPreferences).values(data).onConflictDoUpdate({ target: notificationPreferences.userId, set: data });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "preferences_save_failed" }, { status: 503 });
  }
}
