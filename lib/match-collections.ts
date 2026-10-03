import type { Match } from "./esports-data";

export type CollectionKind = "running" | "upcoming" | "past";
export type CollectionHealth = { state: "fresh" | "cached" | "unavailable"; fetchedAt: string | null };
export type MatchSync = {
  status: "fresh" | "partial" | "stale";
  collections: Record<CollectionKind, CollectionHealth>;
  lastFullSuccessAt: string | null;
};
export type CollectionResult =
  | { kind: CollectionKind; ok: true; matches: Match[]; fetchedAt: string }
  | { kind: CollectionKind; ok: false; error: string };
export type StoredMatches = { matches: Match[]; fetchedAt: string; sync: MatchSync };

const kinds: CollectionKind[] = ["running", "upcoming", "past"];
const rank = { upcoming: 0, live: 1, complete: 2 };
const supportedGames = new Set(["lol", "val", "cs2", "dota", "kog", "pel", "pubg", "mlbb"]);

export function collectionForMatch(match: Match): CollectionKind {
  return match.status === "live" ? "running" : match.status === "complete" ? "past" : "upcoming";
}

export function unavailableSync(): MatchSync {
  return { status: "stale", lastFullSuccessAt: null, collections: {
    running: { state: "unavailable", fetchedAt: null },
    upcoming: { state: "unavailable", fetchedAt: null },
    past: { state: "unavailable", fetchedAt: null },
  } };
}

/** Empty successes clear active collections; failures keep their original records and clocks. */
export function mergeMatchCollections(previous: StoredMatches | null, results: CollectionResult[], attemptedAt: string): StoredMatches {
  const collections = { ...unavailableSync().collections };
  const succeeded = new Set<CollectionKind>();
  for (const kind of kinds) {
    const result = results.find((item) => item.kind === kind);
    const oldTime = previous?.sync.collections[kind].fetchedAt ?? null;
    if (result?.ok) {
      succeeded.add(kind);
      collections[kind] = { state: "fresh", fetchedAt: result.fetchedAt };
    } else {
      collections[kind] = { state: oldTime ? "cached" : "unavailable", fetchedAt: oldTime };
    }
  }
  const oldById = new Map((previous?.matches ?? []).map((match) => [match.id, match]));
  const unique = new Map((previous?.matches ?? [])
    .filter((match) => match.status === "complete" || !succeeded.has(collectionForMatch(match)))
    .map((match) => [match.id, match]));
  for (const result of results) {
    if (!result.ok) continue;
    for (const match of result.matches) {
      if (!supportedGames.has(match.game)) continue;
      // Lists can straddle a status transition. Without an upstream revision,
      // never let a late upcoming/live entry resurrect a later confirmed state.
      const old = unique.get(match.id) ?? oldById.get(match.id);
      const winner = old && (rank[old.status] > rank[match.status]
        || (rank[old.status] === rank[match.status] && Date.parse(old.freshness) > Date.parse(match.freshness))) ? old : match;
      unique.set(match.id, winner);
    }
  }
  const values = [...unique.values()];
  const archived = values.filter((match) => match.status === "complete")
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)).slice(0, 1_000);
  const matches = [...archived, ...values.filter((match) => match.status !== "complete")]
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return {
    matches,
    // A failed attempt must not advance the last successful acquisition clock.
    fetchedAt: succeeded.size ? attemptedAt : previous?.fetchedAt ?? attemptedAt,
    sync: {
      status: succeeded.size === 3 ? "fresh" : succeeded.size ? "partial" : "stale",
      collections,
      lastFullSuccessAt: succeeded.size === 3 ? attemptedAt : previous?.sync.lastFullSuccessAt ?? null,
    },
  };
}
