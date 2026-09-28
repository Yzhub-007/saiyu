import { getReferenceCatalog, type ReferenceKind } from "@/lib/reference-data";

const allowedKinds = new Set<ReferenceKind>(["cs-map", "lol-champion", "dota-hero"]);

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("kind") as ReferenceKind | null;
  if (!value || !allowedKinds.has(value)) {
    return Response.json({ error: "invalid_reference_kind" }, { status: 400 });
  }

  const catalog = await getReferenceCatalog(value);
  return Response.json(
    {
      data: catalog.items,
      meta: { kind: value, fetchedAt: catalog.fetchedAt, warnings: catalog.warnings },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    },
  );
}
