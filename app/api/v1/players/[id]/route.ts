export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json({ data: { id, handle: id === "zmjjkk" ? "ZmjjKK" : id, teamId: "edg", game: "val", stats: { rating: 1.24, firstKillsPerMap: 4.8, sampleMaps: 18 } }, meta: { demo: true, licensedDepth: false } });
}
