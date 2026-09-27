import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, ChevronRight, Database, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { findTournament } from "@/lib/matches-service";
import { FollowButton } from "../../_components/follow-button";
import { SiteShell, TeamMark } from "../../_components/site-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await findTournament(id);
  return tournament ? { title: `${tournament.name}｜赛域`, description: `${tournament.name} 的授权赛程、参赛队伍与官方观赛入口。` } : {};
}

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await findTournament(id);
  if (!tournament) notFound();
  const live = tournament.matches.filter((match) => match.status === "live").length;
  const upcoming = tournament.matches.filter((match) => match.status === "upcoming").length;
  const starts = tournament.matches.map((match) => Date.parse(match.startsAt)).filter(Number.isFinite);
  const range = starts.length ? `${new Date(Math.min(...starts)).toLocaleDateString("zh-CN")} — ${new Date(Math.max(...starts)).toLocaleDateString("zh-CN")}` : "待确认";

  return <SiteShell active="赛事"><main className="mx-auto max-w-[1320px] px-4 py-7 md:px-6"><section className="rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_80%_0%,rgba(104,181,255,0.14),transparent_35%),linear-gradient(135deg,#121820,#0f1318)] p-6 md:p-9"><Badge className="border border-[#68b5ff]/20 bg-[#68b5ff]/10 text-[#8cc8ff]">{live ? `${live} 场进行中` : upcoming ? `${upcoming} 场待赛` : "已结束"}</Badge><h1 className="mt-4 text-3xl font-black text-white md:text-5xl">{tournament.name}</h1><div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500"><span className="flex items-center gap-2"><CalendarDays className="size-4" />{range}</span><span className="flex items-center gap-2"><Users className="size-4" />{tournament.teams.length} 支已确认队伍</span><span className="flex items-center gap-2"><Database className="size-4" />{tournament.gameName}</span></div><div className="mt-6"><FollowButton entityType="tournament" entityId={tournament.id} label="关注赛事" /></div></section><div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6"><div className="flex items-center gap-2"><Trophy className="size-5 text-[#68b5ff]" /><h2 className="text-xl font-bold text-white">赛事赛程</h2></div><div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">{tournament.matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="grid grid-cols-[100px_1fr_auto] items-center gap-3 border-b border-white/[0.07] px-4 py-4 hover:bg-white/[0.03]"><div><p className="text-sm font-bold text-white">{match.status === "live" ? "进行中" : new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p><p className="text-xs text-zinc-600">{match.bestOf}</p></div><div><p className="text-sm font-semibold text-zinc-300">{match.teamA} vs {match.teamB}</p><p className="mt-1 text-xs text-zinc-600">{match.stage}</p></div><ChevronRight className="size-4 text-zinc-700" /></Link>)}</div></section><aside className="space-y-5"><section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><h2 className="text-lg font-bold text-white">已确认队伍</h2><div className="mt-4 space-y-2">{tournament.teams.map((team) => <Link href={`/teams/${team.id}`} key={team.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-3 hover:bg-white/[0.03]"><TeamMark label={team.short} color={team.color} /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-300">{team.name}</span><ChevronRight className="size-4 text-zinc-700" /></Link>)}</div></section><section className="rounded-2xl border border-[#d8ff3e]/15 bg-[#d8ff3e]/[0.03] p-5"><BookOpen className="size-5 text-[#d8ff3e]" /><h2 className="mt-3 font-bold text-white">观赛手册状态</h2><p className="mt-2 text-sm leading-6 text-zinc-500">当前仅发布授权来源能够确认的项目、赛程、阶段与直播入口。积分榜、奖金和晋级规则将在官方来源确认后补充。</p></section></aside></div></main></SiteShell>;
}
