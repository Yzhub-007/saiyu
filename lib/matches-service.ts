import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { matchSnapshots } from "@/db/schema";
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

type MatchListCache = {
  expiresAt: number;
  matches: Match[];
  fetchedAt: string;
  stale: boolean;
  warning?: string;
};
type MatchResult = { data: Match | null; meta: MatchDataMeta };
type MatchDetailCache = MatchResult & { expiresAt: number };

let memoryCache: MatchListCache | null = null;
let listInFlight: Promise<MatchListCache> | null = null;
const detailCache = new Map<string, MatchDetailCache>();
const detailInFlight = new Map<string, Promise<MatchResult>>();
const CACHE_MS = 30_000;
const MAX_DETAIL_CACHE_SIZE = 200;
const MAX_ARCHIVED_MATCHES = 1_000;
const supportedGames = new Set(["lol", "val", "cs2", "dota", "kog", "pel", "pubg", "mlbb"]);

export function isPandaScoreConfigured() {
  return Boolean(process.env.PANDASCORE_TOKEN?.trim());
}

export async function listMatches(filters: MatchFilters = {}): Promise<{ data: Match[]; meta: MatchDataMeta }> {
  const generatedAt = new Date().toISOString();
  if (isPandaScoreConfigured()) {
    const cached = await loadPandaMatches();
    return {
      data: applyFilters(cached.matches, filters),
      meta: {
        source: "pandascore",
        licensed: true,
        generatedAt: cached.fetchedAt,
        stale: cached.stale,
        ...(cached.warning ? { warning: cached.warning } : {}),
      },
    };
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
  if (isPandaScoreConfigured() && id.startsWith("panda-")) {
    const cached = detailCache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      detailCache.delete(id);
      detailCache.set(id, cached);
      return { data: cached.data, meta: cached.meta };
    }
    // Match collections are available on the free Fixtures plan and already
    // contain the basic series result. Prefer that stored record before trying
    // a detail endpoint that may require a Historical subscription.
    const listed = await loadPandaMatches();
    const basicMatch = listed.matches.find((match) => match.id === id);
    if (basicMatch) {
      return {
        data: basicMatch,
        meta: {
          source: "pandascore",
          licensed: true,
          generatedAt: listed.fetchedAt,
          stale: listed.stale,
          ...(listed.warning ? { warning: listed.warning } : {}),
        },
      };
    }
    const pending = detailInFlight.get(id);
    if (pending) return pending;
    if (detailInFlight.size >= MAX_DETAIL_CACHE_SIZE) {
      return staleMatchResult(id, "PandaScore detail refresh is busy");
    }
    const refresh = refreshPandaMatch(id);
    detailInFlight.set(id, refresh);
    try {
      return await refresh;
    } finally {
      detailInFlight.delete(id);
    }
  }

  if (!isPandaScoreConfigured()) {
    const demo = getMatch(id);
    if (demo) {
      return {
        data: demo,
        meta: { source: "demo", licensed: false, generatedAt: new Date().toISOString(), stale: false },
      };
    }
  }

  return {
    data: null,
    meta: { source: "demo", licensed: false, generatedAt: new Date().toISOString(), stale: false },
  };
}

async function loadPandaMatches(): Promise<MatchListCache> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) return memoryCache;
  if (listInFlight) return listInFlight;
  listInFlight = refreshPandaMatches();
  try {
    return await listInFlight;
  } finally {
    listInFlight = null;
  }
}

async function refreshPandaMatches(): Promise<MatchListCache> {
  try {
    const persisted = memoryCache?.matches.length ? null : await loadMatchSnapshot();
    const rows = await new PandaScoreAdapter(process.env.PANDASCORE_TOKEN!).listAll();
    const previousMatches = memoryCache?.matches ?? persisted?.matches ?? [];
    const unique = new Map(
      previousMatches
        .filter((match) => match.status === "complete")
        .map((match) => [match.id, match]),
    );
    // Fresh provider data always wins; completed records that fall outside the
    // latest API page remain in the bounded local archive.
    for (const row of rows) unique.set(row.data.id, row.data);
    const normalized = [...unique.values()]
      .filter((match) => supportedGames.has(match.game))
      .map((match) => preserveTeamLogos(match, previousMatches));
    const archived = normalized
      .filter((match) => match.status === "complete")
      .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
      .slice(0, MAX_ARCHIVED_MATCHES);
    const active = normalized.filter((match) => match.status !== "complete");
    const matches = [...archived, ...active].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    if (!matches.length) throw new Error("PandaScore returned no supported matches");
    const fetchedAt = new Date().toISOString();
    memoryCache = { expiresAt: Date.now() + CACHE_MS, matches, fetchedAt, stale: false };
    await saveMatchSnapshot(matches, fetchedAt);
    return memoryCache;
  } catch (error) {
    const warning = safeMessage(error);
    console.error("PandaScore refresh failed", warning);
    const fallback = memoryCache?.matches.length ? memoryCache : await loadMatchSnapshot();
    memoryCache = {
      expiresAt: Date.now() + CACHE_MS,
      matches: fallback?.matches ?? [],
      fetchedAt: fallback?.fetchedAt ?? new Date().toISOString(),
      stale: true,
      warning,
    };
    return memoryCache;
  }
}

async function refreshPandaMatch(id: string): Promise<MatchResult> {
  let result: MatchResult;
  try {
    const record = await new PandaScoreAdapter(process.env.PANDASCORE_TOKEN!).getMatch(id);
    const previous = detailCache.get(id)?.data;
    const candidates = [...(previous ? [previous] : []), ...(memoryCache?.matches ?? [])];
    result = {
      data: record ? preserveTeamLogos(record.data, candidates) : null,
      meta: {
        source: "pandascore",
        licensed: true,
        generatedAt: record?.fetchedAt ?? new Date().toISOString(),
        stale: false,
      },
    };
  } catch (error) {
    result = staleMatchResult(id, safeMessage(error));
  }
  detailCache.delete(id);
  detailCache.set(id, { ...result, expiresAt: Date.now() + CACHE_MS });
  while (detailCache.size > MAX_DETAIL_CACHE_SIZE) {
    const oldest = detailCache.keys().next().value;
    if (oldest === undefined) break;
    detailCache.delete(oldest);
  }
  return result;
}

function staleMatchResult(id: string, warning: string): MatchResult {
  const previous = detailCache.get(id);
  const listed = memoryCache?.matches.find((match) => match.id === id);
  return {
    data: previous?.data ?? listed ?? null,
    meta: {
      source: "pandascore",
      licensed: true,
      generatedAt: previous?.data
        ? previous.meta.generatedAt
        : listed && memoryCache
          ? memoryCache.fetchedAt
          : new Date().toISOString(),
      stale: true,
      warning,
    },
  };
}

function preserveTeamLogos(match: Match, previous: Match[]): Match {
  const findLogo = (id: string) => {
    for (const candidate of previous) {
      if (candidate.teamAId === id && candidate.teamALogo?.trim()) return candidate.teamALogo;
      if (candidate.teamBId === id && candidate.teamBLogo?.trim()) return candidate.teamBLogo;
    }
    return null;
  };
  return {
    ...match,
    teamALogo: match.teamALogo?.trim() || findLogo(match.teamAId),
    teamBLogo: match.teamBLogo?.trim() || findLogo(match.teamBId),
  };
}

async function saveMatchSnapshot(matches: Match[], fetchedAt: string) {
  if (!matches.length) return;
  try {
    await getDb().insert(matchSnapshots).values({
      key: "latest",
      payload: JSON.stringify(matches),
      fetchedAt,
      updatedAt: fetchedAt,
    }).onConflictDoUpdate({
      target: matchSnapshots.key,
      set: { payload: JSON.stringify(matches), fetchedAt, updatedAt: fetchedAt },
    });
  } catch (error) {
    console.warn("Unable to persist PandaScore snapshot", safeMessage(error));
  }
}

async function loadMatchSnapshot(): Promise<{ matches: Match[]; fetchedAt: string } | null> {
  try {
    const [snapshot] = await getDb().select().from(matchSnapshots).where(eq(matchSnapshots.key, "latest")).limit(1);
    if (!snapshot) return null;
    const parsed = JSON.parse(snapshot.payload) as Match[];
    return Array.isArray(parsed) && parsed.length ? { matches: parsed, fetchedAt: snapshot.fetchedAt } : null;
  } catch (error) {
    console.warn("Unable to read PandaScore snapshot", safeMessage(error));
    return null;
  }
}

export type TeamSummary = {
  id: string;
  name: string;
  short: string;
  game: string;
  gameName: string;
  color: string;
  logo: string | null;
  matches: Match[];
};

export type TournamentSummary = {
  id: string;
  name: string;
  game: string;
  gameName: string;
  matches: Match[];
  teams: Array<{ id: string; name: string; short: string; color: string; logo: string | null }>;
};

export async function listTeams(): Promise<TeamSummary[]> {
  const { data } = await listMatches();
  const teams = new Map<string, Omit<TeamSummary, "matches">>();
  for (const match of data) {
    if (match.teamAId !== "tbd-a") teams.set(match.teamAId, { id: match.teamAId, name: match.teamA, short: match.teamAShort, game: match.game, gameName: match.gameName, color: match.teamAColor, logo: match.teamALogo?.trim() || teams.get(match.teamAId)?.logo || null });
    if (match.teamBId !== "tbd-b") teams.set(match.teamBId, { id: match.teamBId, name: match.teamB, short: match.teamBShort, game: match.game, gameName: match.gameName, color: match.teamBColor, logo: match.teamBLogo?.trim() || teams.get(match.teamBId)?.logo || null });
  }
  return [...teams.values()].map((team) => ({ ...team, matches: data.filter((match) => match.teamAId === team.id || match.teamBId === team.id) }));
}

export async function findTeam(id: string) {
  return (await listTeams()).find((team) => team.id === id) ?? null;
}

export async function listTournaments(): Promise<TournamentSummary[]> {
  const { data } = await listMatches();
  const groups = new Map<string, Match[]>();
  for (const match of data) groups.set(match.tournamentId, [...(groups.get(match.tournamentId) ?? []), match]);
  return [...groups.entries()].map(([id, tournamentMatches]) => {
    const first = tournamentMatches[0];
    const teams = new Map<string, TournamentSummary["teams"][number]>();
    for (const match of tournamentMatches) {
      if (match.teamAId !== "tbd-a") teams.set(match.teamAId, { id: match.teamAId, name: match.teamA, short: match.teamAShort, color: match.teamAColor, logo: match.teamALogo?.trim() || teams.get(match.teamAId)?.logo || null });
      if (match.teamBId !== "tbd-b") teams.set(match.teamBId, { id: match.teamBId, name: match.teamB, short: match.teamBShort, color: match.teamBColor, logo: match.teamBLogo?.trim() || teams.get(match.teamBId)?.logo || null });
    }
    return { id, name: first.league, game: first.game, gameName: first.gameName, matches: tournamentMatches, teams: [...teams.values()] };
  });
}

export async function findTournament(id: string) {
  return (await listTournaments()).find((tournament) => tournament.id === id) ?? null;
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
  return message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/token=[^&\s]+/gi, "token=[redacted]").slice(0, 180);
}
