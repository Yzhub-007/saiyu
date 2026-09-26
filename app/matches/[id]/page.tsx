import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarPlus, Clock3, Database, Radio, ShieldCheck, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMatch, powerRankings } from "@/lib/esports-data";
import { MetricBar, SiteShell, TeamMark } from "../../_components/site-shell";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = getMatch(id);
  return match ? { title: `${match.teamA} vs ${match.teamB}｜赛域`, description: `${match.league} ${match.stage}，赛程、战力分析与官方观赛入口。` } : {};
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = getMatch(id);
  if (!match) notFound();
  const left = powerRankings.find((team) => team.id === match.teamAId) ?? { score: 84, form: 86, opponent: 82, map: 85, roster: 87, schedule: 79 };
  const right = powerRankings.find((team) => team.id === match.teamBId) ?? { score: 82, form: 83, opponent: 81, map: 84, roster: 80, schedule: 82 };

  return (
    <SiteShell>
      <main className="mx-auto max-w-[1280px] px-4 py-7 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600"><div className="flex items-center gap-2"><Link href="/schedule" className="hover:text-white">赛程</Link><span>/</span><Link href={`/tournaments/${match.tournamentId}`} className="hover:text-white">{match.league}</Link><span>/</span><span className="text-zinc-400">{match.teamAShort} vs {match.teamBShort}</span></div><div className="flex items-center gap-2"><Database className="size-3.5" />数据更新于 {match.freshness}</div></div>

        <section className="mt-5 overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_0%,rgba(216,255,62,0.07),transparent_38%),#101419]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-4"><div className="flex items-center gap-2">{match.status === "live" ? <Badge className="border border-[#ff6474]/20 bg-[#ff6474]/10 text-[#ff7685]"><span className="mr-1 size-1.5 animate-pulse rounded-full bg-[#ff6474]" />直播中</Badge> : <Badge variant="outline" className="text-zinc-400">即将开始</Badge>}<span className="font-semibold text-zinc-300">{match.league} · {match.stage}</span></div><span className="text-xs text-zinc-600">{match.bestOf} · {match.gameName}</span></div>
          <div className="grid items-center gap-8 px-6 py-10 md:grid-cols-[1fr_auto_1fr] md:px-16">
            <Link href={`/teams/${match.teamAId}`} className="flex items-center justify-center gap-5 md:justify-end"><div className="text-right"><h1 className="text-2xl font-black text-white">{match.teamA}</h1><p className="mt-2 text-sm text-zinc-500">战力指数 <span className="font-mono font-bold text-[#d8ff3e]">{left.score}</span></p></div><TeamMark label={match.teamAShort} color={match.teamAColor} size="lg" /></Link>
            <div className="text-center"><p className="text-xs font-semibold text-[#d8ff3e]">{match.timeLabel}</p><div className="mt-3 font-mono text-5xl font-black text-white"><span>{match.scoreA ?? "–"}</span><span className="mx-4 text-zinc-700">:</span><span>{match.scoreB ?? "–"}</span></div><p className="mt-3 text-xs text-zinc-600">{match.detail}</p></div>
            <Link href={`/teams/${match.teamBId}`} className="flex items-center justify-center gap-5 md:justify-start"><TeamMark label={match.teamBShort} color={match.teamBColor} size="lg" /><div><h2 className="text-2xl font-black text-white">{match.teamB}</h2><p className="mt-2 text-sm text-zinc-500">战力指数 <span className="font-mono font-bold text-[#d8ff3e]">{right.score}</span></p></div></Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3 border-t border-white/[0.07] bg-black/10 px-4 py-4"><Button asChild className="bg-[#d8ff3e] font-bold text-[#10140d] hover:bg-[#c6ed2f]"><a href={match.streamUrl} target="_blank" rel="noreferrer"><Radio />前往 {match.streamPlatform}<ArrowUpRight /></a></Button><Button variant="outline" asChild className="border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07]"><a href={`/calendar/match/${match.id}.ics`}><CalendarPlus />加入日历</a></Button></div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.15em] text-[#9ab529]">EXPLAINABLE POWER</p><h2 className="mt-1 text-xl font-bold text-white">战力拆解</h2></div><Swords className="size-5 text-zinc-600" /></div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <PowerTeam name={match.teamA} data={left} color={match.teamAColor} />
              <PowerTeam name={match.teamB} data={right} color={match.teamBColor} />
            </div>
            <div className="mt-6 rounded-xl border border-[#d8ff3e]/15 bg-[#d8ff3e]/[0.035] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><ShieldCheck className="size-4 text-[#d8ff3e]" />如何理解这组数据</div><p className="mt-2 text-sm leading-6 text-zinc-500">指数综合最近 10 个系列赛、对手强度、地图表现、阵容稳定度与赛程强度。它只反映近期竞技状态，不是胜率预测，也不构成任何投注建议。</p></div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><p className="text-xs font-semibold tracking-[0.14em] text-zinc-600">OFFICIAL WATCH</p><h2 className="mt-1 text-lg font-bold text-white">官方观赛</h2><div className="mt-4 rounded-xl border border-white/[0.07] bg-black/10 p-4"><p className="font-semibold text-zinc-200">{match.streamPlatform}</p><p className="mt-1 text-xs text-zinc-600">{match.language}</p><p className="mt-3 text-xs leading-5 text-zinc-500">直播由赛事官方平台提供；区域限制和解说语言以官方页面为准。</p></div></section>
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><p className="text-xs font-semibold tracking-[0.14em] text-zinc-600">MATCH INFO</p><div className="mt-4 space-y-4">{[["赛制", match.bestOf], ["阶段", match.stage], ["开赛", new Date(match.startsAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })], ["数据状态", match.status === "live" ? "实时同步" : "已确认"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><span className="text-zinc-600">{label}</span><span className="text-right text-zinc-300">{value}</span></div>)}</div></section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}

function PowerTeam({ name, data, color }: { name: string; data: { form: number; opponent: number; map: number; roster: number; schedule: number }; color: string }) {
  return <div><h3 className="mb-4 text-sm font-bold text-zinc-200">{name}</h3><div className="space-y-4"><MetricBar label="近期状态 · 35%" value={data.form} color={color} /><MetricBar label="对手强度 · 25%" value={data.opponent} color={color} /><MetricBar label="地图 / 阵容 · 20%" value={data.map} color={color} /><MetricBar label="阵容稳定 · 10%" value={data.roster} color={color} /><MetricBar label="赛程强度 · 10%" value={data.schedule} color={color} /></div></div>;
}
