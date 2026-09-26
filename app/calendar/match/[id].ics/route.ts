import { findMatch } from "@/lib/matches-service";
import { calendar, matchEvent } from "@/lib/ics";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: match } = await findMatch(id);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(calendar([matchEvent(match)]), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename=${match.id}.ics` } });
}
