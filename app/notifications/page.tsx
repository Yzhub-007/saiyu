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
  return <SiteShell><main className="mx-auto max-w-[860px] px-4 py-8 md:px-6"><div className="flex items-center gap-3"><Bell className="size-6 text-[#d8ff3e]" /><div><p className="text-xs font-semibold tracking-[0.16em] text-[#9ab529]">NOTIFICATIONS</p><h1 className="mt-1 text-3xl font-black text-white">站内提醒</h1></div></div>{!user ? <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#101419] p-8 text-center"><p className="text-zinc-400">登录后可接收关注赛事的赛前提醒。</p><Link href="/account" className="mt-4 inline-flex rounded-xl bg-[#d8ff3e] px-4 py-2 text-sm font-bold text-[#10140d]">前往登录</Link></div> : rows.length ? <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101419]">{rows.map((item) => <Link key={item.id} href={`/matches/${item.matchId}`} className="flex gap-4 border-b border-white/[0.07] p-5 hover:bg-white/[0.03]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d8ff3e]/10 text-[#d8ff3e]"><CalendarDays className="size-5" /></span><div><h2 className="font-bold text-zinc-200">{item.title}</h2><p className="mt-1 text-sm text-zinc-500">{item.body}</p><p className="mt-2 text-xs text-zinc-700">{new Date(item.createdAt).toLocaleString("zh-CN")}</p></div></Link>)}</div> : <div className="mt-6 grid min-h-52 place-items-center rounded-2xl border border-white/[0.08] bg-[#101419] text-sm text-zinc-600">暂无提醒；关注战队或赛事后会在这里更新。</div>}</main></SiteShell>;
}
