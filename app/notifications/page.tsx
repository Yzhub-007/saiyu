import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Bell, CalendarDays } from "lucide-react";
import { getCurrentUser } from "../auth";
import { SiteShell } from "../_components/site-shell";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "站内提醒｜赛域" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const rows = user ? await getDb().select().from(notifications).where(eq(notifications.userId, user.userId)).orderBy(desc(notifications.createdAt)).limit(50).catch(() => []) : [];
  return <SiteShell><main className="mx-auto max-w-[860px] px-4 py-8 md:px-6"><div className="flex items-center gap-3"><Bell className="size-6 text-brand" /><div><p className="text-xs font-semibold tracking-[0.16em] text-brand">NOTIFICATIONS</p><h1 className="mt-1 text-3xl font-black text-foreground">站内提醒</h1></div></div>{!user ? <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center"><p className="text-soft">登录后可接收关注赛事的赛前提醒。</p><Link href="/account" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">前往登录</Link></div> : rows.length ? <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">{rows.map((item) => <Link key={item.id} href={`/matches/${item.matchId}`} className="flex gap-4 border-b border-border p-5 hover:bg-surface-hover"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-brand"><CalendarDays className="size-5" /></span><div><h2 className="font-bold text-foreground">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-subtle">{new Date(item.createdAt).toLocaleString("zh-CN")}</p></div></Link>)}</div> : <div className="mt-6 grid min-h-52 place-items-center rounded-2xl border border-border bg-card text-sm text-subtle">暂无提醒；关注战队或赛事后会在这里更新。</div>}</main></SiteShell>;
}
