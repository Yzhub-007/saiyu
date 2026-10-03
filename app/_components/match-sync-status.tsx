"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMatchUpdateTime } from "./use-match-updates";
import type { MatchSync } from "@/lib/match-collections";

export function MatchSyncStatus({ source, stale, sync, offline, refreshing, updatedAt, retry }: {
  source: "pandascore" | "demo";
  stale: boolean;
  sync?: MatchSync;
  offline: boolean;
  refreshing: boolean;
  updatedAt: string | null;
  retry: () => void;
}) {
  if (source === "demo") return <p className="text-sm text-muted-foreground">演示数据 · 不代表真实赛况</p>;
  const retained = updatedAt ? " · 保留上次数据" : "";
  const partial = !offline && sync?.status === "partial";
  const label = offline ? `当前离线${retained}` : partial ? "部分更新 · 未同步分类保留原数据" : stale ? `同步中断${retained}` : "自动同步已开启";
  return <div className="flex flex-wrap items-center gap-3">
    <div className="text-sm">
      <p role="status" className={`flex items-center gap-1.5 ${offline || stale ? "text-warning" : "text-muted-foreground"}`}>
        {offline && <WifiOff className="size-4" aria-hidden="true" />}{label}
      </p>
      <p className="mt-0.5 text-xs text-subtle">{updatedAt ? <>{partial ? "最近一次部分获取于" : "最近成功获取于"} <time dateTime={updatedAt} title={updatedAt} suppressHydrationWarning>{formatMatchUpdateTime(updatedAt)}</time> · 本地时间</> : "尚未成功获取数据"}</p>
      {partial && <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="各类比赛同步状态">{([ ["running", "进行中"], ["upcoming", "赛程"], ["past", "赛果"] ] as const).map(([kind, name]) => {
        const health = sync.collections[kind];
        return <li key={kind}><span className={health.state === "fresh" ? "text-muted-foreground" : "text-warning"}>{name}：{health.state === "fresh" ? "已更新" : health.state === "cached" ? "使用缓存" : "暂不可用"}</span>{health.fetchedAt && <> · <time dateTime={health.fetchedAt} title={health.fetchedAt} suppressHydrationWarning>{formatMatchUpdateTime(health.fetchedAt)}</time></>}</li>;
      })}</ul>}
    </div>
    <Button type="button" variant="outline" size="sm" className="min-h-10 bg-card" onClick={retry} disabled={refreshing} aria-busy={refreshing}>
      <RefreshCw aria-hidden="true" />{refreshing ? "正在同步…" : offline || stale ? "重新同步" : "立即刷新"}
    </Button>
  </div>;
}
