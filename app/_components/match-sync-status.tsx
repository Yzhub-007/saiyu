"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMatchUpdateTime } from "./use-match-updates";

export function MatchSyncStatus({ source, stale, offline, refreshing, updatedAt, retry }: {
  source: "pandascore" | "demo";
  stale: boolean;
  offline: boolean;
  refreshing: boolean;
  updatedAt: string | null;
  retry: () => void;
}) {
  if (source === "demo") return <p className="text-sm text-muted-foreground">演示数据 · 不代表真实赛况</p>;
  const retained = updatedAt ? " · 保留上次数据" : "";
  const label = offline ? `当前离线${retained}` : stale ? `同步中断${retained}` : "自动同步已开启";
  return <div className="flex flex-wrap items-center gap-3">
    <div className="text-sm">
      <p role="status" className={`flex items-center gap-1.5 ${offline || stale ? "text-warning" : "text-muted-foreground"}`}>
        {offline && <WifiOff className="size-4" aria-hidden="true" />}{label}
      </p>
      <p className="mt-0.5 text-xs text-subtle">{updatedAt ? <>数据获取于 <time dateTime={updatedAt} title={updatedAt} suppressHydrationWarning>{formatMatchUpdateTime(updatedAt)}</time> · 本地时间</> : "尚未成功获取数据"}</p>
    </div>
    <Button type="button" variant="outline" size="sm" className="min-h-10 bg-card" onClick={retry} disabled={refreshing} aria-busy={refreshing}>
      <RefreshCw aria-hidden="true" />{refreshing ? "正在同步…" : offline || stale ? "重新同步" : "立即刷新"}
    </Button>
  </div>;
}
