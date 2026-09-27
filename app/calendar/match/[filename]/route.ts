import { findMatch } from "@/lib/matches-service";
import { calendar, matchEvent } from "@/lib/ics";

export async function GET(_: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!filename.endsWith(".ics")) return new Response("Not found", { status: 404 });
  const id = filename.slice(0, -4);
  const { data: match } = await findMatch(id);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(calendar([matchEvent(match)]), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename=${match.id}.ics`, "cache-control": "public, max-age=300" } });
}
