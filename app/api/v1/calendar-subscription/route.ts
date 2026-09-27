import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/auth";
import { getDb } from "@/db";
import { calendarTokens } from "@/db/schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const db = getDb();
  const [existing] = await db.select().from(calendarTokens).where(eq(calendarTokens.userId, user.userId)).limit(1);
  const token = existing?.token ?? createToken();
  if (!existing) await db.insert(calendarTokens).values({ token, userId: user.userId });
  return Response.json({ data: { url: `${new URL(request.url).origin}/calendar/${token}.ics` } });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  await getDb().delete(calendarTokens).where(eq(calendarTokens.userId, user.userId));
  return Response.json({ data: { revoked: true } });
}

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}
