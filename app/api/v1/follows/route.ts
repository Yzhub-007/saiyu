import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/auth";
import { getDb } from "@/db";
import { userFollows } from "@/db/schema";

const allowedTypes = new Set(["game", "tournament", "team"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  try {
    const data = await getDb().select().from(userFollows).where(eq(userFollows.userId, user.userId));
    return Response.json({ data });
  } catch {
    return Response.json({ error: "follows_temporarily_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json() as { entityType?: string; entityId?: string };
  const entityType = body.entityType?.trim();
  const entityId = body.entityId?.trim();
  if (!entityType || !allowedTypes.has(entityType) || !entityId) return Response.json({ error: "invalid_follow_target" }, { status: 400 });
  try {
    await getDb().insert(userFollows).values({ userId: user.userId, entityType: entityType as "game" | "tournament" | "team", entityId }).onConflictDoNothing();
    return Response.json({ data: { entityType, entityId, followed: true } }, { status: 201 });
  } catch {
    return Response.json({ error: "follow_save_failed" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (!entityType || !allowedTypes.has(entityType) || !entityId) return Response.json({ error: "invalid_follow_target" }, { status: 400 });
  try {
    await getDb().delete(userFollows).where(and(eq(userFollows.userId, user.userId), eq(userFollows.entityType, entityType as "game" | "tournament" | "team"), eq(userFollows.entityId, entityId)));
    return Response.json({ data: { entityType, entityId, followed: false } });
  } catch {
    return Response.json({ error: "follow_delete_failed" }, { status: 503 });
  }
}
