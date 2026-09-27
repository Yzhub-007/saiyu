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

let memoryCache: { expiresAt: number; matches: Match[] } | null = null;
const CACHE_MS = 45_000;
const supportedGames = new Set(["lol", "val", "cs2", "dota", "kog", "pel", "pubg", "mlbb"]);

export function isPandaScoreConfigured() {
  return Boolean(process.env.PANDASCORE_TOKEN?.trim());
}

export async function listMatches(filters: MatchFilters = {}): Promise<{ data: Match[]; meta: MatchDataMeta }> {
  const generatedAt = new Date().toISOString();
  if (isPandaScoreConfigured()) {
    try {
      const liveMatches = await loadPandaMatches();
      await saveMatchSnapshot(liveMatches, generatedAt);
      return {
        data: applyFilters(liveMatches, filters),
        meta: { source: "pandascore", licensed: true, generatedAt, stale: false },
      };
    } catch (error) {
      console.error("PandaScore refresh failed", safeMessage(error));
      if (memoryCache?.matches.length) {
        return {
          data: applyFilters(memoryCache.matches, filters),
          meta: {
            source: "pandascore",
            licensed: true,
            generatedAt,
            stale: true,
            warning: safeMessage(error),
          },
        };
      }
      const snapshot = await loadMatchSnapshot();
      if (snapshot?.matches.length) {
        memoryCache = { expiresAt: Date.now() + CACHE_MS, matches: snapshot.matches };
        return {
          data: applyFilters(snapshot.matches, filters),
          meta: {
            source: "pandascore",
            licensed: true,
            generatedAt: snapshot.fetchedAt,
            stale: true,
            warning: safeMessage(error),
          },
        };
      }
      return {
        data: [],
        meta: {
          source: "pandascore",
          licensed: true,
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

async function loadPandaMatches() {
  if (memoryCache && memoryCache.expiresAt > Date.now()) return memoryCache.matches;
  const rows = await new PandaScoreAdapter(process.env.PANDASCORE_TOKEN!).listAll();
  const unique = new Map(rows.map((row) => [row.data.id, row.data]));
  const matches = [...unique.values()]
    .filter((match) => supportedGames.has(match.game))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  if (!matches.length) throw new Error("PandaScore returned no supported matches");
  memoryCache = { expiresAt: Date.now() + CACHE_MS, matches };
  return matches;
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
  matches: Match[];
};

export type TournamentSummary = {
  id: string;
  name: string;
  game: string;
  gameName: string;
  matches: Match[];
  teams: Array<{ id: string; name: string; short: string; color: string }>;
};

export async function listTeams(): Promise<TeamSummary[]> {
  const { data } = await listMatches();
  const teams = new Map<string, Omit<TeamSummary, "matches">>();
  for (const match of data) {
    if (match.teamAId !== "tbd-a") teams.set(match.teamAId, { id: match.teamAId, name: match.teamA, short: match.teamAShort, game: match.game, gameName: match.gameName, color: match.teamAColor });
    if (match.teamBId !== "tbd-b") teams.set(match.teamBId, { id: match.teamBId, name: match.teamB, short: match.teamBShort, game: match.game, gameName: match.gameName, color: match.teamBColor });
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
    const teams = new Map<string, { id: string; name: string; short: string; color: string }>();
    for (const match of tournamentMatches) {
      if (match.teamAId !== "tbd-a") teams.set(match.teamAId, { id: match.teamAId, name: match.teamA, short: match.teamAShort, color: match.teamAColor });
      if (match.teamBId !== "tbd-b") teams.set(match.teamBId, { id: match.teamBId, name: match.teamB, short: match.teamBShort, color: match.teamBColor });
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
  return message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 180);
}
