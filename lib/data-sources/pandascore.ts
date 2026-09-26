import type { MatchSourceAdapter, SourceRecord } from "./types";
import type { Match } from "../esports-data";

type PandaMatch = { id: number; name: string; scheduled_at: string; status: string; videogame?: { slug?: string; name?: string }; league?: { name?: string }; tournament?: { name?: string }; opponents?: Array<{ opponent?: { id?: number; name?: string; acronym?: string; image_url?: string } }>; streams_list?: Array<{ raw_url?: string; language?: string; official?: boolean }> };

export class PandaScoreAdapter implements MatchSourceAdapter {
  readonly id = "pandascore";
  constructor(private readonly token: string) {}
  async listUpcoming(): Promise<SourceRecord<Partial<Match>>[]> {
    if (!this.token) throw new Error("PANDASCORE_TOKEN is not configured");
    const response = await fetch("https://api.pandascore.co/matches/upcoming?per_page=100", { headers: { authorization: `Bearer ${this.token}`, accept: "application/json" } });
    if (!response.ok) throw new Error(`PandaScore request failed: ${response.status}`);
    const rows = await response.json() as PandaMatch[];
    const fetchedAt = new Date().toISOString();
    return rows.map((row) => ({ source: this.id, tier: "licensed", fetchedAt, externalId: String(row.id), data: { id: `panda-${row.id}`, game: row.videogame?.slug ?? "unknown", gameName: row.videogame?.name ?? "未知项目", league: row.league?.name ?? "待确认赛事", stage: row.tournament?.name ?? "待确认阶段", status: "upcoming", startsAt: row.scheduled_at, timeLabel: row.scheduled_at, bestOf: "BO?", teamA: row.opponents?.[0]?.opponent?.name ?? "待定", teamAShort: row.opponents?.[0]?.opponent?.acronym ?? "TBD", teamB: row.opponents?.[1]?.opponent?.name ?? "待定", teamBShort: row.opponents?.[1]?.opponent?.acronym ?? "TBD", streamUrl: row.streams_list?.find((stream) => stream.official)?.raw_url ?? "", language: row.streams_list?.find((stream) => stream.official)?.language ?? "", freshness: fetchedAt } }));
  }
}
