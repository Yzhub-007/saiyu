import { MatchTeamNames } from "../../_components/match-team-names";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ChevronRight, Database, ShieldCheck } from "lucide-react";
import { findTeam } from "@/lib/matches-service";
import { listBasicPlayersForTeam } from "@/lib/reference-data";
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
  const roster = await listBasicPlayersForTeam(team.id, team.game);
  const completed = team.matches.filter((match) => match.status === "complete" && match.scoreA !== null && match.scoreB !== null);
  const wins = completed.filter((match) => match.teamAId === id ? Number(match.scoreA) > Number(match.scoreB) : Number(match.scoreB) > Number(match.scoreA)).length;
  const upcoming = team.matches.filter((match) => match.status !== "complete").length;

  return (
    <SiteShell active="战队">
      <main className="mx-auto max-w-[1240px] px-4 py-7 md:px-6">
        <section className="rounded-3xl border border-border match-spotlight p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-5"><TeamMark label={team.short} color={team.color} logo={team.logo} name={team.name} size="lg" /><div className="min-w-0 break-words"><p className="text-xs font-semibold tracking-[0.14em] text-subtle">{team.gameName} · 授权聚合数据</p><h1 className="mt-2 text-3xl font-black text-foreground md:text-4xl">{team.name}</h1><p className="mt-2 text-sm text-muted-foreground">已收录 {team.matches.length} 场相关比赛</p></div></div>
            <FollowButton entityType="team" entityId={team.id} label="关注战队" />
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-2"><Activity className="size-5 text-brand" /><h2 className="text-xl font-bold text-foreground">近期与下一场</h2></div>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">{team.matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="detail-match-row items-center gap-3 border-b border-border px-4 py-4 hover:bg-surface-hover"><div><p className="text-sm font-bold text-foreground">{match.status === "live" ? "进行中" : new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p><p className="text-xs text-subtle">{match.bestOf}</p></div><div><p className="text-sm font-semibold text-soft"><MatchTeamNames match={match} /></p><p className="mt-1 text-xs text-subtle">{match.league} · {match.stage}</p></div><ChevronRight className="size-4 text-subtle" /></Link>)}</div>
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Database className="size-5 text-subtle" /><h2 className="text-lg font-bold text-foreground">基础阵容</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">仅展示数据源公开的姓名、位置和地区，不包含付费比赛统计。</p>{roster.data.length > 0 ? <ul className="mt-4 space-y-2">{roster.data.map((player) => <li key={player.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-inset p-3">{player.imageUrl ? <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-[#f4f5f1]"><img src={player.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="size-full object-contain" /></span> : <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-hover text-xs font-bold text-subtle">{player.name.slice(0, 2).toUpperCase()}</span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-soft">{player.name}</span><span className="mt-0.5 block truncate text-xs text-subtle">{[player.role, player.nationality, player.active ? "现役" : "非现役"].filter(Boolean).join(" · ")}</span></span></li>)}</ul> : <p className="mt-4 rounded-xl border border-border bg-surface-inset p-4 text-sm leading-6 text-muted-foreground">{roster.warning}</p>}</section>
            <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Database className="size-5 text-subtle" /><h2 className="text-lg font-bold text-foreground">已确认事实</h2></div><div className="mt-4 space-y-4">{[["已结束样本", `${completed.length} 场`], ["已记录胜场", `${wins} 场`], ["待赛 / 进行中", `${upcoming} 场`]].map(([label, value]) => <div key={label} className="flex justify-between text-sm"><span className="text-subtle">{label}</span><span className="font-mono text-soft">{value}</span></div>)}</div></section>
            <section className="rounded-2xl border border-brand/15 bg-primary/[0.03] p-5"><ShieldCheck className="size-5 text-brand" /><h2 className="mt-3 font-bold text-foreground">战力数据暂不展示</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">当前只展示授权来源可确认的赛程与赛果。阵容、地图和对手强度样本达到规则要求后才会生成战力指数。</p></section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
