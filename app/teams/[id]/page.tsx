import Link from "next/link";
import { Activity, BellPlus, ChevronRight, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTeam, matches } from "@/lib/esports-data";
import { MetricBar, SiteShell, TeamMark } from "../../_components/site-shell";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = getTeam(id);
  return { title: `${team.name} 战队资料｜赛域`, description: `${team.name} 阵容、近期赛事与战力分析。` };
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = getTeam(id);
  const related = matches.filter((match) => match.teamAId === id || match.teamBId === id);
  return (
    <SiteShell active="战队">
      <main className="mx-auto max-w-[1240px] px-4 py-7 md:px-6">
        <section className="rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_88%_0%,rgba(216,255,62,0.06),transparent_36%),#101419] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6"><div className="flex items-center gap-5"><TeamMark label={team.short} color={team.color} size="lg" /><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-600">{team.game} · {team.region}</p><h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{team.name}</h1><p className="mt-2 text-sm text-zinc-500">{team.form}</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-zinc-600">当前战力</p><p className="font-mono text-4xl font-black text-[#d8ff3e]">{team.score}</p></div><Button className="bg-[#d8ff3e] font-bold text-[#10140d] hover:bg-[#c6ed2f]"><BellPlus />关注战队</Button></div></div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6"><div className="flex items-center gap-2"><Activity className="size-5 text-[#d8ff3e]" /><h2 className="text-xl font-bold text-white">状态分析</h2></div><div className="mt-6 grid gap-6 sm:grid-cols-2"><div className="space-y-4"><MetricBar label="近期状态 · 35%" value={91} color={team.color} /><MetricBar label="对手强度 · 25%" value={86} color={team.color} /><MetricBar label="地图 / 阵容 · 20%" value={89} color={team.color} /></div><div className="space-y-3">{team.strengths.map((item) => <div key={item} className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-3 text-sm leading-5 text-zinc-400"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#8fa827]" />{item}</div>)}</div></div></section>
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6"><h2 className="text-xl font-bold text-white">近期与下一场</h2><div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07]">{related.length ? related.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="grid grid-cols-[100px_1fr_auto] items-center gap-3 border-b border-white/[0.06] px-4 py-4 hover:bg-white/[0.03]"><div><p className="text-sm font-bold text-white">{match.timeLabel}</p><p className="text-xs text-zinc-600">{match.bestOf}</p></div><div><p className="text-sm font-semibold text-zinc-300">{match.teamA} vs {match.teamB}</p><p className="mt-1 text-xs text-zinc-600">{match.league} · {match.stage}</p></div><ChevronRight className="size-4 text-zinc-700" /></Link>) : <p className="p-8 text-center text-sm text-zinc-600">暂无已确认赛程</p>}</div></section>
          </div>
          <aside className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><div className="flex items-center gap-2"><Users className="size-5 text-zinc-600" /><h2 className="text-lg font-bold text-white">当前阵容</h2></div><div className="mt-4 space-y-2">{team.roster.map((player, index) => <Link key={player} href={`/players/${player.toLowerCase()}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 hover:bg-white/[0.03]"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-white/[0.05] font-mono text-xs text-zinc-500">P{index + 1}</span><span className="text-sm font-semibold text-zinc-300">{player}</span></div><ChevronRight className="size-4 text-zinc-700" /></Link>)}</div><p className="mt-4 text-xs leading-5 text-zinc-600">阵容信息仅在官方或授权来源确认后更新。</p></aside>
        </div>
      </main>
    </SiteShell>
  );
}
