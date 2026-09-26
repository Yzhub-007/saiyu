import { calendar, matchEvent } from "@/lib/ics";
import { listMatches } from "@/lib/matches-service";

export async function GET() {
  const { data } = await listMatches();
  return new Response(calendar(data.filter((match) => match.status !== "complete").map(matchEvent)), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": "attachment; filename=saiyu-calendar.ics", "cache-control": "public, max-age=300" } });
}
