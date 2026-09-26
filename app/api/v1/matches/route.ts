import { matches } from "@/lib/esports-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = url.searchParams.get("game");
  const status = url.searchParams.get("status");
  const result = matches.filter((match) => (!game || match.game === game) && (!status || match.status === status));
  return Response.json({ data: result, meta: { count: result.length, demo: true, generatedAt: new Date().toISOString() } });
}
