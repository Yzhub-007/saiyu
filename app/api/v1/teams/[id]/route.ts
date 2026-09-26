import { getTeam, matches } from "@/lib/esports-data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json({ data: { ...getTeam(id), matches: matches.filter((match) => match.teamAId === id || match.teamBId === id) }, meta: { demo: true } });
}
