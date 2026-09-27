import { findTeam } from "@/lib/matches-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await findTeam(id);
  if (!team) return Response.json({ error: "team_not_found" }, { status: 404 });
  return Response.json({ data: team, meta: { source: "pandascore", demo: false, licensedDepth: false } });
}
