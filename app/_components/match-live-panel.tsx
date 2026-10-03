"use client";

import { ArrowUpRight, CalendarPlus, Radio, AlertTriangle } from "lucide-react";
import { MatchStatus } from "./fixture-row";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/esports-data";
import { FollowButton } from "./follow-button";
import { TeamMark } from "./team-mark";
import { GameScorePanel } from "./game-score-panel";
import { useMatchUpdate } from "./use-match-updates";
import { MatchSyncStatus } from "./match-sync-status";

export function MatchLivePanel({ initialMatch, source, stale: initialStale, generatedAt }: { initialMatch: Match; source: "pandascore" | "demo"; stale: boolean; generatedAt: string }) {
  const updates = useMatchUpdate(initialMatch, { source, stale: initialStale, generatedAt });
  const { match, stale } = updates;

  return <section className="match-spotlight mt-5 overflow-hidden rounded-3xl border border-border">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
      <div className="flex flex-wrap items-center gap-2"><MatchStatus status={match.status} /><span className="font-semibold text-soft">{match.league} · {match.stage}</span></div>
      <span className="text-xs text-subtle">{match.bestOf} · {match.gameName}</span>
    </div>
    {stale && <p role="status" className="flex items-center gap-2 border-b border-warning/20 bg-warning/[0.07] px-5 py-3 text-xs text-warning"><AlertTriangle className="size-4 shrink-0" />同步暂时中断，保留上次成功获取的比分。</p>}
    <h1 className="sr-only">{match.teamA} 对阵 {match.teamB}</h1>
    <div className="spotlight-matchup detail-matchup">
      <a href={`/teams/${match.teamAId}`} className="spotlight-team"><TeamMark label={match.teamAShort} name={match.teamA} logo={match.teamALogo} color={match.teamAColor} size="lg" /><p>{match.teamA}</p></a>
      <div className="spotlight-score"><span className="text-xs text-muted-foreground">{match.status === "upcoming" ? "即将开赛" : "系列比分"}</span><strong aria-label={match.status === "upcoming" ? "即将对阵" : `系列比分 ${match.scoreA ?? "待更新"} 比 ${match.scoreB ?? "待更新"}`}>{match.status === "upcoming" ? <span className="spotlight-vs">VS</span> : <>{match.scoreA ?? "–"}<span className="score-divider">:</span>{match.scoreB ?? "–"}</>}</strong><span className="text-xs text-muted-foreground">{match.timeLabel}</span></div>
      <a href={`/teams/${match.teamBId}`} className="spotlight-team"><TeamMark label={match.teamBShort} name={match.teamB} logo={match.teamBLogo} color={match.teamBColor} size="lg" /><p>{match.teamB}</p></a>
    </div>
    <div className="flex justify-center px-5 pb-5"><MatchSyncStatus source={source} {...updates} /></div>
    <GameScorePanel match={match} />
    <div className="flex flex-wrap justify-center gap-3 border-t border-border bg-surface-inset px-4 py-4">{match.streamUrl && <Button asChild className="bg-primary font-bold text-primary-foreground hover:bg-brand-hover"><a href={match.streamUrl} target="_blank" rel="noreferrer"><Radio />前往 {match.streamPlatform}<ArrowUpRight /></a></Button>}<Button variant="outline" asChild className="border-border bg-surface-hover text-soft hover:bg-surface-hover"><a href={`/calendar/match/${match.id}.ics`}><CalendarPlus />加入日历</a></Button><FollowButton entityType="tournament" entityId={match.tournamentId} label="关注赛事" /></div>
  </section>;
}
