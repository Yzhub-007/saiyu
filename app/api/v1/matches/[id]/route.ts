import { getMatch } from "@/lib/esports-data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = getMatch(id);
  return match ? Response.json({ data: match, meta: { demo: true } }) : Response.json({ error: "match_not_found" }, { status: 404 });
}
