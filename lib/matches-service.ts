import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { matchSnapshots } from "@/db/schema";
import { getMatch, matches as demoMatches, type Match } from "./esports-data";
import { PandaScoreAdapter } from "./data-sources/pandascore";
import { getExternalDataSourcesForGame, type ExternalDataSource } from "./external-data-sources";
import { collectionForMatch, mergeMatchCollections, type MatchSync, type StoredMatches } from "./match-collections";
import { isMatch, readMatchSync, validTimestamp } from "./match-refresh";

export type MatchDataMeta = {
  source: "pandascore" | "demo";
  licensed: boolean;
  generatedAt: string;
  stale: boolean;
  sync?: MatchSync;
  warning?: string;
};

type MatchFilters = {
  game?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

type MatchListCache = StoredMatches & {
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
        sync: cached.sync,
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
          generatedAt: basicMatch.freshness,
          // A healthy collection can still update this match during a partial refresh.
          stale: listed.stale && (listed.sync.collections[collectionForMatch(basicMatch)].state !== "fresh"
            || basicMatch.freshness !== listed.sync.collections[collectionForMatch(basicMatch)].fetchedAt),
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
  const persisted = memoryCache ? null : await loadMatchSnapshot();
  const previous = memoryCache ?? persisted;
  try {
    const results = (await new PandaScoreAdapter(process.env.PANDASCORE_TOKEN!).listCollections()).map((result) =>
      result.ok && !result.matches.every(isMatch)
        ? { kind: result.kind, ok: false as const, error: "PandaScore returned invalid match records" }
        : result);
    const merged = mergeMatchCollections(previous, results, new Date().toISOString());
    const failures = results.flatMap((result) => result.ok ? [] : [`${result.kind}: ${result.error}`]);
    const warning = failures.length ? safeMessage(new Error(`PandaScore collection failures: ${failures.join("; ")}`)) : undefined;
    if (warning) console.warn("PandaScore partial/unavailable refresh", warning);
    memoryCache = {
      ...merged,
      matches: merged.matches.map((match) => preserveTeamLogos(match, previous?.matches ?? [])),
      expiresAt: Date.now() + CACHE_MS,
      stale: merged.sync.status !== "fresh",
      warning,
    };
    if (merged.sync.status !== "stale") await saveMatchSnapshot(memoryCache);
    return memoryCache;
  } catch (error) {
    const warning = safeMessage(error);
    console.error("PandaScore refresh failed", warning);
    memoryCache = {
      ...mergeMatchCollections(previous, [], new Date().toISOString()),
      expiresAt: Date.now() + CACHE_MS,
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
          ? listed.freshness
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

async function saveMatchSnapshot({ matches, fetchedAt, sync }: StoredMatches) {
  const payload = JSON.stringify({ version: 2, matches, sync });
  try {
    await getDb().insert(matchSnapshots).values({
      key: "latest",
      payload,
      fetchedAt,
      updatedAt: fetchedAt,
    }).onConflictDoUpdate({
      target: matchSnapshots.key,
      set: { payload, fetchedAt, updatedAt: fetchedAt },
      setWhere: sql`${matchSnapshots.fetchedAt} <= ${fetchedAt}`,
    });
  } catch (error) {
    console.warn("Unable to persist PandaScore snapshot", safeMessage(error));
  }
}

async function loadMatchSnapshot(): Promise<StoredMatches | null> {
  try {
    const [snapshot] = await getDb().select().from(matchSnapshots).where(eq(matchSnapshots.key, "latest")).limit(1);
    if (!snapshot) return null;
    if (!validTimestamp(snapshot.fetchedAt)) return null;
    const parsed = JSON.parse(snapshot.payload);
    // Read the previous array format without changing the DB schema or old data.
    const matches: unknown = Array.isArray(parsed) ? parsed : parsed?.version === 2 ? parsed.matches : null;
    if (!Array.isArray(matches) || !matches.every(isMatch)) return null;
    const legacySync: MatchSync = { status: "fresh", lastFullSuccessAt: snapshot.fetchedAt, collections: {
      running: { state: "fresh", fetchedAt: snapshot.fetchedAt },
      upcoming: { state: "fresh", fetchedAt: snapshot.fetchedAt },
      past: { state: "fresh", fetchedAt: snapshot.fetchedAt },
    } };
    const sync = Array.isArray(parsed) ? legacySync : readMatchSync(parsed.sync);
    return sync ? { matches, fetchedAt: snapshot.fetchedAt, sync } : null;
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
  dataSources: ExternalDataSource[];
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
    return {
      id,
      name: first.league,
      game: first.game,
      gameName: first.gameName,
      matches: tournamentMatches,
      teams: [...teams.values()],
      dataSources: getExternalDataSourcesForGame(first.game),
    };
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
