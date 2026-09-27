import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { calendarTokens, userFollows } from "@/db/schema";
import { calendar, matchEvent } from "@/lib/ics";
import { listMatches } from "@/lib/matches-service";

export async function GET(_: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!filename.endsWith(".ics")) return new Response("Not found", { status: 404 });
  const token = filename.slice(0, -4);
  if (!/^[a-f0-9]{48}$/.test(token)) return new Response("Not found", { status: 404 });
  const db = getDb();
  const [subscription] = await db.select().from(calendarTokens).where(eq(calendarTokens.token, token)).limit(1);
  if (!subscription) return new Response("Not found", { status: 404 });
  const follows = await db.select().from(userFollows).where(eq(userFollows.userId, subscription.userId));
  const { data } = await listMatches();
  const selected = data.filter((match) => match.status !== "complete" && follows.some((follow) => (follow.entityType === "game" && follow.entityId === match.game) || (follow.entityType === "tournament" && follow.entityId === match.tournamentId) || (follow.entityType === "team" && (follow.entityId === match.teamAId || follow.entityId === match.teamBId))));
  return new Response(calendar(selected.map(matchEvent)), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": "inline; filename=saiyu-following.ics", "cache-control": "private, max-age=300" } });
}
