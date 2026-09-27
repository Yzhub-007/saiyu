import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ChevronRight, Database, ShieldCheck } from "lucide-react";
import { findTeam } from "@/lib/matches-service";
import { FollowButton } from "../../_components/follow-button";
import { SiteShell, TeamMark } from "../../_components/site-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await findTeam(id);
  return team ? { title: `${team.name} 战队资料｜赛域`, description: `${team.name} 的授权赛程与近期赛果。` } : {};
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await findTeam(id);
  if (!team) notFound();
  const completed = team.matches.filter((match) => match.status === "complete" && match.scoreA !== null && match.scoreB !== null);
  const wins = completed.filter((match) => match.teamAId === id ? Number(match.scoreA) > Number(match.scoreB) : Number(match.scoreB) > Number(match.scoreA)).length;
  const upcoming = team.matches.filter((match) => match.status !== "complete").length;

  return (
    <SiteShell active="战队">
      <main className="mx-auto max-w-[1240px] px-4 py-7 md:px-6">
        <section className="rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_88%_0%,rgba(216,255,62,0.06),transparent_36%),#101419] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5"><TeamMark label={team.short} color={team.color} size="lg" /><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-600">{team.gameName} · 授权聚合数据</p><h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{team.name}</h1><p className="mt-2 text-sm text-zinc-500">已收录 {team.matches.length} 场相关比赛</p></div></div>
            <FollowButton entityType="team" entityId={team.id} label="关注战队" />
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6">
            <div className="flex items-center gap-2"><Activity className="size-5 text-[#d8ff3e]" /><h2 className="text-xl font-bold text-white">近期与下一场</h2></div>
            <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">{team.matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="grid grid-cols-[100px_1fr_auto] items-center gap-3 border-b border-white/[0.06] px-4 py-4 hover:bg-white/[0.03]"><div><p className="text-sm font-bold text-white">{match.status === "live" ? "进行中" : new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p><p className="text-xs text-zinc-600">{match.bestOf}</p></div><div><p className="text-sm font-semibold text-zinc-300">{match.teamA} vs {match.teamB}</p><p className="mt-1 text-xs text-zinc-600">{match.league} · {match.stage}</p></div><ChevronRight className="size-4 text-zinc-700" /></Link>)}</div>
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><div className="flex items-center gap-2"><Database className="size-5 text-zinc-600" /><h2 className="text-lg font-bold text-white">已确认事实</h2></div><div className="mt-4 space-y-4">{[["已结束样本", `${completed.length} 场`], ["已记录胜场", `${wins} 场`], ["待赛 / 进行中", `${upcoming} 场`]].map(([label, value]) => <div key={label} className="flex justify-between text-sm"><span className="text-zinc-600">{label}</span><span className="font-mono text-zinc-300">{value}</span></div>)}</div></section>
            <section className="rounded-2xl border border-[#d8ff3e]/15 bg-[#d8ff3e]/[0.03] p-5"><ShieldCheck className="size-5 text-[#d8ff3e]" /><h2 className="mt-3 font-bold text-white">战力数据暂不展示</h2><p className="mt-2 text-sm leading-6 text-zinc-500">当前只展示授权来源可确认的赛程与赛果。阵容、地图和对手强度样本达到规则要求后才会生成战力指数。</p></section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
