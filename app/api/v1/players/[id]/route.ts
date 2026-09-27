export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json({ error: "licensed_player_data_unavailable", data: { id }, meta: { demo: false, licensedDepth: false } }, { status: 404 });
}
