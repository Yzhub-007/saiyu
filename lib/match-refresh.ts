import type { Match } from "./esports-data";
import type { MatchSync } from "./match-collections";

export type MatchSource = "pandascore" | "demo";
export type MatchSnapshot = { matches: Match[]; updatedAt: string; stale: boolean; sync?: MatchSync };

export function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

const strings = ["id", "game", "gameName", "league", "tournamentId", "stage", "timeLabel", "bestOf", "teamA", "teamAShort", "teamAId", "teamAColor", "teamB", "teamBShort", "teamBId", "teamBColor", "detail", "streamUrl", "streamPlatform", "language"] as const;

export function isMatch(value: unknown): value is Match {
  if (!value || typeof value !== "object") return false;
  const match = value as Record<string, unknown>;
  return strings.every((key) => typeof match[key] === "string")
    && validTimestamp(match.startsAt) && validTimestamp(match.freshness)
    && ["live", "upcoming", "complete"].includes(match.status as string)
    && [match.scoreA, match.scoreB].every((score) => score === null || (typeof score === "number" && Number.isInteger(score) && score >= 0))
    && [match.teamALogo, match.teamBLogo].every((logo) => logo == null || typeof logo === "string")
    && (match.games === undefined || (Array.isArray(match.games) && match.games.every((game) => game && typeof game.id === "string" && Number.isInteger(game.position) && game.position > 0 && ["live", "upcoming", "complete", "canceled"].includes(game.status) && (game.winnerId === null || typeof game.winnerId === "string") && (game.mapName == null || typeof game.mapName === "string"))));
}

export function readMatchSync(value: unknown): MatchSync | null {
  if (!value || typeof value !== "object") return null;
  const sync = value as MatchSync;
  if (!sync.collections || !(sync.lastFullSuccessAt === null || validTimestamp(sync.lastFullSuccessAt))) return null;
  let fresh = 0;
  for (const kind of ["running", "upcoming", "past"] as const) {
    const health = sync.collections[kind];
    if (!health || !["fresh", "cached", "unavailable"].includes(health.state)) return null;
    if (health.state === "unavailable" ? health.fetchedAt !== null : !validTimestamp(health.fetchedAt)) return null;
    if (health.state === "fresh") fresh++;
  }
  return sync.status === (fresh === 3 ? "fresh" : fresh ? "partial" : "stale") ? sync : null;
}

/** A successful HTTP response is not necessarily fresh or renderable match data. */
export function readMatchSnapshot(payload: unknown, source: MatchSource, matchId?: string): MatchSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as { data?: unknown; meta?: { source?: unknown; stale?: unknown; generatedAt?: unknown; sync?: unknown } };
  if (body.meta?.source !== source || !validTimestamp(body.meta.generatedAt)) return null;
  const sync = body.meta.sync === undefined ? undefined : readMatchSync(body.meta.sync);
  if (sync === null || (body.meta.stale !== false && !(body.meta.stale === true && sync?.status === "partial"))) return null;
  if (sync && body.meta.stale !== (sync.status !== "fresh")) return null;
  const matches = matchId ? isMatch(body.data) && body.data.id === matchId ? [body.data] : null : Array.isArray(body.data) ? body.data : null;
  if (!matches || !matches.every(isMatch)) return null;
  return { matches, updatedAt: body.meta.generatedAt, stale: body.meta.stale === true, ...(sync ? { sync } : {}) };
}

/** A partial response from another worker must not roll individual records back. */
export function reconcileMatchSnapshot(next: MatchSnapshot, current: Match[]): MatchSnapshot {
  const previous = new Map(current.map((match) => [match.id, match]));
  const ranks = { upcoming: 0, live: 1, complete: 2 };
  const matches = next.matches.map((match) => {
    const old = previous.get(match.id);
    previous.delete(match.id);
    return old && (Date.parse(old.freshness) > Date.parse(match.freshness) || ranks[old.status] > ranks[match.status]) ? old : match;
  });
  if (next.sync?.status === "partial") {
    for (const old of previous.values()) {
      const kind = old.status === "live" ? "running" : old.status === "complete" ? "past" : "upcoming";
      if (next.sync.collections[kind].state !== "fresh") matches.push(old);
    }
  }
  return { ...next, matches: matches.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)) };
}

export function isOlderSnapshot(next: MatchSnapshot, current: string | null) {
  return validTimestamp(current) && Date.parse(next.updatedAt) < Date.parse(current);
}
