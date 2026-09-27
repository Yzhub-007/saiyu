import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationPreferences, notifications, reminderDeliveries, userFollows } from "@/db/schema";
import { listMatches } from "@/lib/matches-service";
import { sendReminderEmail } from "@/lib/reminder-mail";

export async function POST(request: Request) {
  const secret = process.env.REMINDER_CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const [preferences, follows, matchResult] = await Promise.all([db.select().from(notificationPreferences), db.select().from(userFollows), listMatches({ status: "upcoming" })]);
  const now = Date.now();
  const siteUrl = process.env.SITE_URL?.trim() || new URL(request.url).origin;
  let inAppSent = 0;
  let emailSent = 0;

  for (const preference of preferences) {
    const userFollowsRows = follows.filter((follow) => follow.userId === preference.userId);
    if (!userFollowsRows.length) continue;
    for (const match of matchResult.data) {
      if (!matchesFollow(match, userFollowsRows)) continue;
      const minutes = (Date.parse(match.startsAt) - now) / 60_000;
      const triggers: Array<"24h" | "15m"> = [];
      if (preference.reminder24h && minutes >= 1435 && minutes <= 1445) triggers.push("24h");
      if (preference.reminder15m && minutes >= 10 && minutes <= 20) triggers.push("15m");
      for (const trigger of triggers) {
        const title = `${match.teamA} vs ${match.teamB}`;
        const body = trigger === "24h" ? `将在 24 小时后开始 · ${match.league}` : `将在 15 分钟后开始 · ${match.league}`;
        if (preference.inAppEnabled) {
          const inserted = await db.insert(reminderDeliveries).values({ userId: preference.userId, matchId: match.id, trigger, channel: "in_app" }).onConflictDoNothing().returning({ id: reminderDeliveries.id });
          if (inserted.length) {
            await db.insert(notifications).values({ userId: preference.userId, matchId: match.id, trigger, title, body }).onConflictDoNothing();
            inAppSent += 1;
          }
        }
        if (preference.emailEnabled && preference.userEmail) {
          const inserted = await db.insert(reminderDeliveries).values({ userId: preference.userId, matchId: match.id, trigger, channel: "email" }).onConflictDoNothing().returning({ id: reminderDeliveries.id });
          if (inserted.length) {
            const sent = await sendReminderEmail({ userId: preference.userId, to: preference.userEmail, match, lead: trigger, siteUrl, timezone: preference.timezone });
            if (sent) emailSent += 1;
            else await db.delete(reminderDeliveries).where(eq(reminderDeliveries.id, inserted[0].id));
          }
        }
      }
    }
  }
  return Response.json({ data: { inAppSent, emailSent, checkedUsers: preferences.length, checkedMatches: matchResult.data.length } });
}

function matchesFollow(match: { game: string; tournamentId: string; teamAId: string; teamBId: string }, follows: Array<{ entityType: string; entityId: string }>) {
  return follows.some((follow) => (follow.entityType === "game" && follow.entityId === match.game) || (follow.entityType === "tournament" && follow.entityId === match.tournamentId) || (follow.entityType === "team" && (follow.entityId === match.teamAId || follow.entityId === match.teamBId)));
}
