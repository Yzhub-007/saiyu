"use client";

import { useEffect } from "react";

type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
type ModelContext = { registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void> };

export function WebMcpTools({ onFilter }: { onFilter: (gameId: string) => void }) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const supported = new Set(["all", "lol", "val", "cs2", "dota", "kog", "pel", "pubg", "mlbb"]);
    void Promise.resolve(context.registerTool({ name: "filter_matches_by_game", title: "按项目筛选比赛", description: "在赛域首页按电竞项目筛选直播和赛程。", inputSchema: { type: "object", properties: { gameId: { type: "string", enum: [...supported] } }, required: ["gameId"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { const gameId = typeof input === "object" && input !== null && "gameId" in input ? String((input as { gameId: unknown }).gameId) : ""; if (!supported.has(gameId)) throw new Error("不支持的比赛项目"); onFilter(gameId); return { gameId, filtered: true }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool({ name: "open_match", title: "打开比赛详情", description: "打开指定比赛的赛程、战力分析与官方观赛入口。", inputSchema: { type: "object", properties: { matchId: { type: "string" } }, required: ["matchId"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute(input) { const matchId = typeof input === "object" && input !== null && "matchId" in input ? String((input as { matchId: unknown }).matchId) : ""; if (!/^[a-z0-9-]+$/.test(matchId)) throw new Error("无效的比赛编号"); window.location.assign(`/matches/${matchId}`); return { matchId, navigating: true }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [onFilter]);
  return null;
}
