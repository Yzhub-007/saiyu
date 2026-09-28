import { ChevronRight } from "lucide-react";
import type { Match } from "@/lib/esports-data";
import { TeamMark } from "./team-mark";

export function MatchStatus({ status }: { status: Match["status"] }) {
  return <span className={`match-status match-status-${status}`}><span aria-hidden="true" />{status === "live" ? "进行中" : status === "complete" ? "已结束" : "未开始"}</span>;
}

/** A fixed score column stays readable even when team names wrap. */
export function FixtureRow({ match, showDate = true }: { match: Match; showDate?: boolean }) {
  const finished = match.status === "complete";
  return (
    <a href={`/matches/${match.id}`} className="fixture-row">
      <div className="fixture-time">
        <MatchStatus status={match.status} />
        <time dateTime={match.startsAt} suppressHydrationWarning>{new Date(match.startsAt).toLocaleString("zh-CN", { ...(showDate ? { month: "numeric", day: "numeric" } as const : {}), hour: "2-digit", minute: "2-digit" })}</time>
      </div>
      <div className="fixture-teams">
        <span className="sr-only">{match.status === "upcoming" ? "即将对阵" : "系列比分"}</span>
        {[
          { id: "a", name: match.teamA, short: match.teamAShort, color: match.teamAColor, logo: match.teamALogo, score: match.scoreA, other: match.scoreB },
          { id: "b", name: match.teamB, short: match.teamBShort, color: match.teamBColor, logo: match.teamBLogo, score: match.scoreB, other: match.scoreA },
        ].map((team) => <div className="fixture-team" key={team.id}>
          <span aria-hidden="true"><TeamMark label={team.short} color={team.color} logo={team.logo} name={team.name} size="sm" /></span>
          <span className="fixture-name">{team.name}</span>
          <span className={`fixture-score ${finished && team.score != null && team.other != null && team.score > team.other ? "text-brand" : ""}`} aria-label={match.status === "upcoming" ? "未开始" : team.score == null ? "比分待更新" : `${team.score} 局`}>{match.status === "upcoming" ? "–" : team.score ?? "–"}</span>
        </div>)}
      </div>
      <div className="fixture-context"><span className="fixture-league">{match.league}</span><span>{match.gameName} · {match.bestOf}</span><span className="fixture-stage">{match.stage}</span></div>
      <ChevronRight className="fixture-arrow size-4" aria-hidden="true" />
    </a>
  );
}
