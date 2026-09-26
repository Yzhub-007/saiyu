import { getMatch, matches as demoMatches, type Match } from "./esports-data";
import { PandaScoreAdapter } from "./data-sources/pandascore";

export type MatchDataMeta = {
  source: "pandascore" | "demo";
  licensed: boolean;
  generatedAt: string;
  stale: boolean;
  warning?: string;
};

type MatchFilters = {
  game?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

let memoryCache: { expiresAt: number; matches: Match[] } | null = null;
const CACHE_MS = 45_000;

export function isPandaScoreConfigured() {
  return Boolean(process.env.PANDASCORE_TOKEN?.trim());
}

export async function listMatches(filters: MatchFilters = {}): Promise<{ data: Match[]; meta: MatchDataMeta }> {
  const generatedAt = new Date().toISOString();
  if (isPandaScoreConfigured()) {
    try {
      const liveMatches = await loadPandaMatches();
      return {
        data: applyFilters(liveMatches, filters),
        meta: { source: "pandascore", licensed: true, generatedAt, stale: false },
      };
    } catch (error) {
      return {
        data: applyFilters(demoMatches, filters),
        meta: {
          source: "demo",
          licensed: false,
          generatedAt,
          stale: true,
          warning: safeMessage(error),
        },
      };
    }
  }

  return {
    data: applyFilters(demoMatches, filters),
    meta: {
      source: "demo",
      licensed: false,
      generatedAt,
      stale: false,
      warning: "PANDASCORE_TOKEN is not configured",
    },
  };
}

export async function findMatch(id: string): Promise<{ data: Match | null; meta: MatchDataMeta }> {
  const demo = getMatch(id);
  if (demo) {
    return {
      data: demo,
      meta: { source: "demo", licensed: false, generatedAt: new Date().toISOString(), stale: false },
    };
  }

  if (isPandaScoreConfigured() && id.startsWith("panda-")) {
    try {
      const record = await new PandaScoreAdapter(process.env.PANDASCORE_TOKEN!).getMatch(id);
      return {
        data: record?.data ?? null,
        meta: { source: "pandascore", licensed: true, generatedAt: new Date().toISOString(), stale: false },
      };
    } catch (error) {
      return {
        data: null,
        meta: {
          source: "pandascore",
          licensed: true,
          generatedAt: new Date().toISOString(),
          stale: true,
          warning: safeMessage(error),
        },
      };
    }
  }

  return {
    data: null,
    meta: { source: "demo", licensed: false, generatedAt: new Date().toISOString(), stale: false },
  };
}

async function loadPandaMatches() {
  if (memoryCache && memoryCache.expiresAt > Date.now()) return memoryCache.matches;
  const rows = await new PandaScoreAdapter(process.env.PANDASCORE_TOKEN!).listAll();
  const unique = new Map(rows.map((row) => [row.data.id, row.data]));
  const matches = [...unique.values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  memoryCache = { expiresAt: Date.now() + CACHE_MS, matches };
  return matches;
}

function applyFilters(data: Match[], filters: MatchFilters) {
  const start = filters.dateFrom ? Date.parse(filters.dateFrom) : Number.NEGATIVE_INFINITY;
  const end = filters.dateTo ? Date.parse(filters.dateTo) : Number.POSITIVE_INFINITY;
  return data.filter((match) => {
    const time = Date.parse(match.startsAt);
    return (
      (!filters.game || match.game === filters.game) &&
      (!filters.status || match.status === filters.status) &&
      time >= start &&
      time <= end
    );
  });
}

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "upstream unavailable";
  return message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 180);
}
