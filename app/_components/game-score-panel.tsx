import { Activity, Info } from "lucide-react";
import type { Match } from "@/lib/esports-data";

/** Fixtures have game status/winners, not in-game scores. Never infer kills or rounds from series results. */
export function GameScorePanel({ match, compact = false }: { match: Match; compact?: boolean }) {
  if (match.status === "upcoming") return null;
  const games = match.games ?? [];
  const current = games.find((game) => game.status === "live");
  const explanation = match.status === "complete"
    ? "当前数据未提供单局回合／击杀比分。"
    : match.scoreCoverage === "not-covered"
      ? "数据源不覆盖本场的实时小比分，可前往官方直播观看。"
      : "实时回合／击杀数据尚未接入，系列比分与单局进度仍会自动更新。";

  return (
    <div className={`border-t border-border bg-surface-inset ${compact ? "px-5 py-4" : "px-5 py-5 md:px-8"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Activity className="size-4 text-brand" />单局进度</h2>
        <span className="text-xs text-muted-foreground">{current ? `第 ${current.position} 局进行中` : match.status === "complete" ? "比赛已结束" : "单局状态待更新"}</span>
      </div>
      {games.length > 0 ? <ol className="mt-3 flex flex-wrap gap-2" aria-label="各局比赛状态">
        {games.map((game) => {
          const winner = game.winnerId === match.teamAId ? match.teamAShort : game.winnerId === match.teamBId ? match.teamBShort : null;
          const status = game.status === "live" ? "进行中" : game.status === "complete" ? winner ? `${winner} 胜` : "已结束" : game.status === "canceled" || match.status === "complete" ? "未进行" : "待开始";
          return <li key={game.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${game.status === "live" ? "border-brand/30 bg-primary/[0.06] text-brand" : "border-border bg-card text-muted-foreground"}`}><span className="font-mono tabular-nums">G{game.position}</span><span className="font-medium">{status}</span></li>;
        })}
      </ol> : <p className="mt-3 text-xs text-muted-foreground">单局状态待数据源更新</p>}
      <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" /><p><span className="font-medium text-soft">{match.status === "live" ? "实时小比分暂不可用。" : "小比分暂不可用。"}</span>{explanation}</p></div>
    </div>
  );
}
