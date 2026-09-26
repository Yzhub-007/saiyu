import { matches, tournament } from "@/lib/esports-data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== tournament.id) return Response.json({ error: "tournament_not_found" }, { status: 404 });
  return Response.json({ data: { ...tournament, matches: matches.filter((match) => match.tournamentId === id) }, meta: { demo: true } });
}
