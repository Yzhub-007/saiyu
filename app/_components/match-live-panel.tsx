"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarPlus, Radio, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/esports-data";
import { FollowButton } from "./follow-button";
import { TeamMark } from "./team-mark";
import { GameScorePanel } from "./game-score-panel";
import { useMatchUpdate } from "./use-match-updates";

export function MatchLivePanel({ initialMatch, source, stale: initialStale }: { initialMatch: Match; source: "pandascore" | "demo"; stale: boolean }) {
  const { match, stale, updatedAt } = useMatchUpdate(initialMatch, { source, stale: initialStale });
  const date = Date.parse(updatedAt ?? "");
  const updated = Number.isFinite(date) ? new Date(date).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "待同步";

  return <section className="match-spotlight mt-5 overflow-hidden rounded-3xl border border-border">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">{match.status === "live" ? <Badge className="border border-danger/20 bg-danger/10 text-danger"><span className="mr-1 size-1.5 rounded-full bg-danger" />进行中</Badge> : <Badge variant="outline" className="text-soft">{match.status === "complete" ? "已结束" : "即将开始"}</Badge>}<span className="font-semibold text-soft">{match.league} · {match.stage}</span></div>
      <span className="text-xs text-subtle">{match.bestOf} · {match.gameName}</span>
    </div>
    {stale && <p role="status" className="flex items-center gap-2 border-b border-warning/20 bg-warning/[0.07] px-5 py-3 text-xs text-warning"><AlertTriangle className="size-4 shrink-0" />同步暂时中断，保留上次成功获取的比分。</p>}
    <div className="grid items-center gap-7 px-5 py-9 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-10">
      <Link href={`/teams/${match.teamAId}`} className="flex min-w-0 items-center justify-center gap-4 md:justify-end"><div className="min-w-0 text-right"><h1 className="break-words text-xl font-bold text-foreground md:text-2xl">{match.teamA}</h1><p className="mt-2 text-xs text-muted-foreground">{match.teamAShort}</p></div><TeamMark label={match.teamAShort} name={match.teamA} logo={match.teamALogo} color={match.teamAColor} size="lg" /></Link>
      <div className="text-center"><p className="text-xs font-medium text-muted-foreground">系列比分</p><div className="mt-3 font-mono text-5xl font-black tabular-nums text-foreground" aria-label={`系列比分 ${match.scoreA ?? "未知"} 比 ${match.scoreB ?? "未知"}`}><span>{match.scoreA ?? "–"}</span><span className="mx-4 text-subtle">:</span><span>{match.scoreB ?? "–"}</span></div><p className="mt-3 text-xs font-semibold text-brand">{match.timeLabel}</p></div>
      <Link href={`/teams/${match.teamBId}`} className="flex min-w-0 items-center justify-center gap-4 md:justify-start"><TeamMark label={match.teamBShort} name={match.teamB} logo={match.teamBLogo} color={match.teamBColor} size="lg" /><div className="min-w-0"><h2 className="break-words text-xl font-bold text-foreground md:text-2xl">{match.teamB}</h2><p className="mt-2 text-xs text-muted-foreground">{match.teamBShort}</p></div></Link>
    </div>
    <p className="px-5 pb-4 text-center text-xs text-muted-foreground" title={match.freshness}>{source === "demo" ? "演示数据 · 不代表真实赛况" : `每 30 秒刷新 · ${stale ? "上次成功更新" : "更新于"} ${updated}（北京时间）`}</p>
    <GameScorePanel match={match} />
    <div className="flex flex-wrap justify-center gap-3 border-t border-border bg-surface-inset px-4 py-4">{match.streamUrl && <Button asChild className="bg-primary font-bold text-primary-foreground hover:bg-brand-hover"><a href={match.streamUrl} target="_blank" rel="noreferrer"><Radio />前往 {match.streamPlatform}<ArrowUpRight /></a></Button>}<Button variant="outline" asChild className="border-border bg-surface-hover text-soft hover:bg-surface-hover"><a href={`/calendar/match/${match.id}.ics`}><CalendarPlus />加入日历</a></Button><FollowButton entityType="tournament" entityId={match.tournamentId} label="关注赛事" /></div>
  </section>;
}
