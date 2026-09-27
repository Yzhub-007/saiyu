import { findTournament } from "@/lib/matches-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await findTournament(id);
  if (!tournament) return Response.json({ error: "tournament_not_found" }, { status: 404 });
  return Response.json({ data: tournament, meta: { source: "pandascore", demo: false } });
}
