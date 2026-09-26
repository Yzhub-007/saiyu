import type { Match } from "../esports-data";

export type SourceTier = "editor-lock" | "official" | "licensed" | "community-licensed";
export type SourceRecord<T> = { source: string; tier: SourceTier; fetchedAt: string; externalId: string; data: T };
export interface MatchSourceAdapter { readonly id: string; listUpcoming(): Promise<SourceRecord<Partial<Match>>[]>; }

export const sourcePriority: Record<SourceTier, number> = { "editor-lock": 400, official: 300, licensed: 200, "community-licensed": 100 };

export function choosePreferred<T>(records: SourceRecord<T>[]) {
  return [...records].sort((a, b) => sourcePriority[b.tier] - sourcePriority[a.tier] || Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt))[0] ?? null;
}
