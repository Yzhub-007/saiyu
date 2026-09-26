import { matches } from "@/lib/esports-data";
import { calendar, matchEvent } from "@/lib/ics";

export async function GET() {
  return new Response(calendar(matches.filter((match) => match.status !== "complete").map(matchEvent)), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": "attachment; filename=saiyu-calendar.ics", "cache-control": "public, max-age=300" } });
}
