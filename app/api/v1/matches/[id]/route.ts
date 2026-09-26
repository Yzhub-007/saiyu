import { findMatch } from "@/lib/matches-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findMatch(id);
  return result.data
    ? Response.json(
        { data: result.data, meta: { ...result.meta, demo: result.meta.source === "demo" } },
        { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } },
      )
    : Response.json({ error: "match_not_found", meta: result.meta }, { status: 404 });
}
