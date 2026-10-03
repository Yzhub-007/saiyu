"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Match } from "@/lib/esports-data";
import { isOlderSnapshot, readMatchSnapshot, validTimestamp, type MatchSource } from "@/lib/match-refresh";

type MatchUpdates = { matches: Match[]; stale: boolean; updatedAt: string | null; offline: boolean; refreshing: boolean };
type Options = { source: MatchSource; stale: boolean; generatedAt?: string };

function latestFreshness(matches: Match[]) {
  let latest: string | null = null;
  let latestTime = -Infinity;
  for (const match of matches) {
    const time = Date.parse(match.freshness);
    if (Number.isFinite(time) && time > latestTime) {
      latest = match.freshness;
      latestTime = time;
    }
  }
  return latest;
}

export function formatMatchUpdateTime(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function useMatchUpdates(initialMatches: Match[], options: Options) {
  return useMatchPolling(initialMatches, options, "/api/v1/matches");
}

export function useMatchUpdate(initialMatch: Match, options: Options) {
  const { matches, ...state } = useMatchPolling([initialMatch], options, `/api/v1/matches/${encodeURIComponent(initialMatch.id)}`, initialMatch.id);
  return { match: matches[0] ?? initialMatch, ...state };
}

function useMatchPolling(initialMatches: Match[], options: Options, endpoint: string, matchId?: string) {
  const { source } = options;
  const [state, setState] = useState<MatchUpdates>(() => ({
    matches: initialMatches,
    stale: options.stale,
    updatedAt: options.stale && !initialMatches.length ? null : validTimestamp(options.generatedAt) ? options.generatedAt : latestFreshness(initialMatches),
    offline: false,
    refreshing: false,
  }));
  const retryRef = useRef<() => void>(() => {});
  const retry = useCallback(() => retryRef.current(), []);

  useEffect(() => {
    if (source === "demo") return;

    let disposed = false;
    let timer: number | null = null;
    let activeRequest: AbortController | null = null;

    const markStale = () => setState((current) => current.stale ? current : { ...current, stale: true });

    function schedule() {
      if (!disposed && !document.hidden && navigator.onLine !== false) timer = window.setTimeout(() => void refresh(), 30_000);
    }

    async function refresh() {
      if (disposed || document.hidden || activeRequest) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      const request = new AbortController();
      activeRequest = request;
      setState((current) => ({ ...current, refreshing: true }));
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]) });
        if (!response.ok) throw new Error("Match refresh failed");
        const body: unknown = await response.json();
        if (disposed || request.signal.aborted || document.hidden) return;
        const snapshot = readMatchSnapshot(body, source, matchId);
        if (!snapshot) {
          markStale();
          return;
        }
        // A different worker may return an older cached response. Never roll scores back.
        setState((current) => isOlderSnapshot(snapshot, current.updatedAt)
          ? { ...current, stale: true }
          : { ...snapshot, stale: false, offline: false, refreshing: false });
      } catch {
        if (!disposed && !request.signal.aborted && !document.hidden) markStale();
      } finally {
        if (activeRequest === request) {
          activeRequest = null;
          if (!disposed) setState((current) => ({ ...current, refreshing: false }));
          schedule();
        }
      }
    }

    function stop() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      activeRequest?.abort();
      activeRequest = null;
    }

    function handleVisibility() {
      stop();
      if (disposed) return;
      const offline = navigator.onLine === false;
      setState((current) => ({ ...current, offline, refreshing: false, stale: current.stale || offline }));
      if (!document.hidden && !offline) void refresh();
    }

    // navigator.onLine is advisory: the explicit retry still attempts a request.
    retryRef.current = () => void refresh();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleVisibility);
    window.addEventListener("offline", handleVisibility);
    handleVisibility();
    return () => {
      disposed = true;
      stop();
      retryRef.current = () => {};
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleVisibility);
      window.removeEventListener("offline", handleVisibility);
    };
  }, [source, endpoint, matchId]);

  return { ...state, retry };
}
