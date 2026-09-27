import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/auth";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const data = await getDb().select().from(notifications).where(eq(notifications.userId, user.userId)).orderBy(desc(notifications.createdAt)).limit(50);
  return Response.json({ data, meta: { unread: data.filter((item) => !item.readAt).length } });
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  await getDb().update(notifications).set({ readAt: new Date().toISOString() }).where(eq(notifications.userId, user.userId));
  return Response.json({ data: { read: true } });
}
