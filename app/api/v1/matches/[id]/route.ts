import { findMatch } from "@/lib/matches-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findMatch(id);
  return result.data
    ? Response.json(
        { data: result.data, meta: { ...result.meta, demo: result.meta.source === "demo" } },
        { headers: { "cache-control": "no-store" } },
      )
    : Response.json(
        { error: result.meta.stale ? "match_unavailable" : "match_not_found", meta: result.meta },
        { status: result.meta.stale ? 503 : 404, headers: { "cache-control": "no-store" } },
      );
}
