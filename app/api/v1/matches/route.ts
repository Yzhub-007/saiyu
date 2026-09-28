import { listMatches } from "@/lib/matches-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = url.searchParams.get("game");
  const status = url.searchParams.get("status");
  const result = await listMatches({
    game,
    status,
    dateFrom: url.searchParams.get("date_from"),
    dateTo: url.searchParams.get("date_to"),
  });
  return Response.json(
    { data: result.data, meta: { ...result.meta, count: result.data.length, demo: result.meta.source === "demo" } },
    { headers: { "cache-control": "no-store" } },
  );
}
