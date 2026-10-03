import type { Match } from "./esports-data";

export type MatchSource = "pandascore" | "demo";
export type MatchSnapshot = { matches: Match[]; updatedAt: string };

export function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

const strings = ["id", "game", "gameName", "league", "tournamentId", "stage", "timeLabel", "bestOf", "teamA", "teamAShort", "teamAId", "teamAColor", "teamB", "teamBShort", "teamBId", "teamBColor", "detail", "streamUrl", "streamPlatform", "language"] as const;

function isMatch(value: unknown): value is Match {
  if (!value || typeof value !== "object") return false;
  const match = value as Record<string, unknown>;
  return strings.every((key) => typeof match[key] === "string")
    && validTimestamp(match.startsAt) && validTimestamp(match.freshness)
    && ["live", "upcoming", "complete"].includes(match.status as string)
    && [match.scoreA, match.scoreB].every((score) => score === null || (typeof score === "number" && Number.isInteger(score) && score >= 0))
    && [match.teamALogo, match.teamBLogo].every((logo) => logo == null || typeof logo === "string")
    && (match.games === undefined || (Array.isArray(match.games) && match.games.every((game) => game && typeof game.id === "string" && Number.isInteger(game.position) && game.position > 0 && ["live", "upcoming", "complete", "canceled"].includes(game.status) && (game.winnerId === null || typeof game.winnerId === "string") && (game.mapName == null || typeof game.mapName === "string"))));
}

/** A successful HTTP response is not necessarily fresh or renderable match data. */
export function readMatchSnapshot(payload: unknown, source: MatchSource, matchId?: string): MatchSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as { data?: unknown; meta?: { source?: unknown; stale?: unknown; generatedAt?: unknown } };
  if (body.meta?.source !== source || body.meta.stale !== false || !validTimestamp(body.meta.generatedAt)) return null;
  const matches = matchId ? isMatch(body.data) && body.data.id === matchId ? [body.data] : null : Array.isArray(body.data) ? body.data : null;
  if (!matches || !matches.every(isMatch)) return null;
  return { matches, updatedAt: body.meta.generatedAt };
}

export function isOlderSnapshot(next: MatchSnapshot, current: string | null) {
  return validTimestamp(current) && Date.parse(next.updatedAt) < Date.parse(current);
}
