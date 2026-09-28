"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/lib/esports-data";

type MatchSource = "pandascore" | "demo";
type MatchUpdates = { matches: Match[]; stale: boolean; updatedAt: string | null };
type MatchResponse = { data?: Match[] | Match | null; meta?: { stale?: boolean; source?: MatchSource } };

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
  return new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function useMatchUpdates(initialMatches: Match[], options: { source: MatchSource; stale: boolean }) {
  return useMatchPolling(initialMatches, options, "/api/v1/matches");
}

export function useMatchUpdate(initialMatch: Match, options: { source: MatchSource; stale: boolean }) {
  const { matches, stale, updatedAt } = useMatchPolling([initialMatch], options, `/api/v1/matches/${encodeURIComponent(initialMatch.id)}`, initialMatch.id);
  return { match: matches[0] ?? initialMatch, stale, updatedAt };
}

function useMatchPolling(initialMatches: Match[], options: { source: MatchSource; stale: boolean }, endpoint: string, matchId?: string) {
  const { source } = options;
  const [state, setState] = useState<MatchUpdates>(() => ({
    matches: initialMatches,
    stale: options.stale,
    updatedAt: latestFreshness(initialMatches),
  }));

  useEffect(() => {
    if (source === "demo") return;

    let disposed = false;
    let interval: number | null = null;
    let activeRequest: AbortController | null = null;

    const markStale = () => setState((current) => current.stale ? current : { ...current, stale: true });

    async function refresh() {
      if (disposed || document.hidden || activeRequest) return;
      const request = new AbortController();
      activeRequest = request;
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]) });
        if (!response.ok) throw new Error("Match refresh failed");
        const body = await response.json() as MatchResponse;
        if (disposed || request.signal.aborted || document.hidden) return;
        const nextMatches = matchId
          ? body.data && !Array.isArray(body.data) && body.data.id === matchId ? [body.data] : null
          : Array.isArray(body.data) ? body.data : null;
        // Never replace successful data with a stale snapshot, malformed payload, or different source.
        if (!nextMatches || !nextMatches.every((match) => match && typeof match.id === "string" && typeof match.freshness === "string") || body.meta?.stale !== false || body.meta.source !== source) {
          markStale();
          return;
        }
        setState({ matches: nextMatches, stale: false, updatedAt: latestFreshness(nextMatches) });
      } catch {
        if (!disposed && !request.signal.aborted && !document.hidden) markStale();
      } finally {
        if (activeRequest === request) activeRequest = null;
      }
    }

    function stop() {
      if (interval !== null) window.clearInterval(interval);
      interval = null;
      activeRequest?.abort();
      activeRequest = null;
    }

    function handleVisibility() {
      stop();
      if (!disposed && !document.hidden) {
        void refresh();
        interval = window.setInterval(() => void refresh(), 30_000);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();
    return () => {
      disposed = true;
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [source, endpoint, matchId]);

  return state;
}
