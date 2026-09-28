import Link from "next/link";
import { CalendarDays, ChevronRight, Trophy } from "lucide-react";
import { listTournaments } from "@/lib/matches-service";
import { SiteShell } from "../_components/site-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "赛事中心｜赛域" };

export default async function TournamentsPage() {
  const tournaments = (await listTournaments()).sort((a, b) => Date.parse(a.matches[0]?.startsAt ?? "") - Date.parse(b.matches[0]?.startsAt ?? ""));
  return <SiteShell active="赛事"><main className="mx-auto max-w-[1180px] px-4 py-7 md:px-6"><div className="flex items-center gap-3"><Trophy className="size-6 text-brand" /><div><p className="text-xs font-semibold tracking-[0.16em] text-brand">TOURNAMENTS</p><h1 className="mt-1 text-3xl font-black text-foreground">赛事中心</h1></div></div><p className="mt-3 text-sm text-muted-foreground">从授权赛程实时整理，赛事结构不明确时不会补写积分榜或晋级关系。</p><section className="mt-6 grid gap-3 md:grid-cols-2">{tournaments.map((tournament) => { const upcoming = tournament.matches.filter((match) => match.status !== "complete").length; return <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="rounded-2xl border border-border bg-card p-5 transition hover:border-brand/25 hover:bg-surface-hover"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-brand">{tournament.gameName}</p><h2 className="mt-2 text-lg font-bold text-foreground">{tournament.name}</h2></div><ChevronRight className="size-5 text-subtle" /></div><div className="mt-4 flex items-center gap-4 text-xs text-subtle"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{tournament.matches.length} 场</span><span>{upcoming} 场待赛 / 进行中</span><span>{tournament.teams.length} 队</span></div></Link>; })}</section></main></SiteShell>;
}
