import type { Match } from "../esports-data";
import type { MatchSourceAdapter, SourceRecord } from "./types";

type PandaOpponent = {
  opponent?: { id?: number; name?: string; acronym?: string; image_url?: string };
};

type PandaResult = { score?: number; team_id?: number };

type PandaMatch = {
  id: number;
  name?: string;
  begin_at?: string | null;
  scheduled_at?: string | null;
  end_at?: string | null;
  status?: string;
  match_type?: string | null;
  number_of_games?: number | null;
  videogame?: { slug?: string; name?: string };
  league?: { id?: number; name?: string; slug?: string };
  serie?: { id?: number; name?: string; full_name?: string };
  tournament?: { id?: number; name?: string; slug?: string };
  opponents?: PandaOpponent[];
  results?: PandaResult[];
  streams_list?: Array<{
    raw_url?: string;
    language?: string;
    official?: boolean;
    main?: boolean;
  }>;
};

const gameAliases: Record<string, { id: string; name: string }> = {
  "league-of-legends": { id: "lol", name: "英雄联盟" },
  lol: { id: "lol", name: "英雄联盟" },
  valorant: { id: "val", name: "无畏契约" },
  "counter-strike": { id: "cs2", name: "CS2" },
  "cs-go": { id: "cs2", name: "CS2" },
  cs2: { id: "cs2", name: "CS2" },
  dota2: { id: "dota", name: "Dota 2" },
  "dota-2": { id: "dota", name: "Dota 2" },
  "king-of-glory": { id: "kog", name: "王者荣耀" },
  pubg: { id: "pubg", name: "PUBG" },
  "pubg-mobile": { id: "pel", name: "和平精英" },
  "mobile-legends-bang-bang": { id: "mlbb", name: "MLBB" },
  mlbb: { id: "mlbb", name: "MLBB" },
};

export class PandaScoreAdapter implements MatchSourceAdapter {
  readonly id = "pandascore";

  constructor(private readonly token: string) {}

  async listUpcoming(): Promise<SourceRecord<Partial<Match>>[]> {
    return this.fetchCollection("upcoming");
  }

  async listAll(): Promise<SourceRecord<Match>[]> {
    const collections = await Promise.allSettled([
      this.fetchCollection("running"),
      this.fetchCollection("upcoming"),
      this.fetchCollection("past", 50),
    ]);
    const rows = collections.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    if (!rows.length) {
      const rejection = collections.find((result) => result.status === "rejected");
      throw rejection && rejection.status === "rejected"
        ? rejection.reason
        : new Error("PandaScore returned no matches");
    }
    return rows as SourceRecord<Match>[];
  }

  async getMatch(id: string): Promise<SourceRecord<Match> | null> {
    const numericId = id.startsWith("panda-") ? id.slice(6) : id;
    if (!/^\d+$/.test(numericId)) return null;
    const response = await this.request(`/matches/${numericId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`PandaScore request failed: ${response.status}`);
    const fetchedAt = new Date().toISOString();
    return this.toRecord((await response.json()) as PandaMatch, fetchedAt);
  }

  private async fetchCollection(kind: "running" | "upcoming" | "past", perPage = 100) {
    const sort = kind === "past" ? "&sort=-end_at" : "&sort=begin_at";
    const response = await this.request(`/matches/${kind}?per_page=${perPage}${sort}`);
    if (!response.ok) throw new Error(`PandaScore ${kind} request failed: ${response.status}`);
    const fetchedAt = new Date().toISOString();
    const rows = (await response.json()) as PandaMatch[];
    return rows.map((row) => this.toRecord(row, fetchedAt));
  }

  private request(path: string) {
    if (!this.token) throw new Error("PANDASCORE_TOKEN is not configured");
    return fetch(`https://api.pandascore.co${path}`, {
      headers: { authorization: `Bearer ${this.token}`, accept: "application/json" },
    });
  }

  private toRecord(row: PandaMatch, fetchedAt: string): SourceRecord<Match> {
    const game = normalizeGame(row.videogame?.slug, row.videogame?.name);
    const teamA = row.opponents?.[0]?.opponent;
    const teamB = row.opponents?.[1]?.opponent;
    const startsAt = row.begin_at ?? row.scheduled_at ?? fetchedAt;
    const status = normalizeStatus(row.status);
    const stream =
      row.streams_list?.find((item) => item.official && item.main) ??
      row.streams_list?.find((item) => item.official) ??
      row.streams_list?.[0];
    const teamAId = teamA?.id ? `panda-team-${teamA.id}` : "tbd-a";
    const teamBId = teamB?.id ? `panda-team-${teamB.id}` : "tbd-b";

    return {
      source: this.id,
      tier: "licensed",
      fetchedAt,
      externalId: String(row.id),
      data: {
        id: `panda-${row.id}`,
        game: game.id,
        gameName: game.name,
        league: row.league?.name ?? "待确认赛事",
        tournamentId: row.tournament?.id ? `panda-tournament-${row.tournament.id}` : "unknown",
        stage: row.tournament?.name ?? row.serie?.full_name ?? row.serie?.name ?? "待确认阶段",
        status,
        startsAt,
        timeLabel: formatTimeLabel(startsAt, status),
        bestOf: formatBestOf(row),
        teamA: teamA?.name ?? "待定",
        teamAShort: teamA?.acronym ?? shortName(teamA?.name, "TBD"),
        teamAId,
        teamAColor: colorFor(teamAId),
        scoreA: scoreFor(row.results, teamA?.id, status),
        teamB: teamB?.name ?? "待定",
        teamBShort: teamB?.acronym ?? shortName(teamB?.name, "TBD"),
        teamBId,
        teamBColor: colorFor(teamBId),
        scoreB: scoreFor(row.results, teamB?.id, status),
        detail: status === "live" ? "官方数据实时同步" : status === "complete" ? "已结束" : row.name ?? "赛前信息待更新",
        streamUrl: stream?.raw_url ?? "",
        streamPlatform: platformFor(stream?.raw_url),
        language: stream?.language || "以官方页面为准",
        freshness: fetchedAt,
      },
    };
  }
}

function normalizeGame(slug?: string, fallback?: string) {
  const normalized = slug?.toLowerCase() ?? "unknown";
  return gameAliases[normalized] ?? { id: normalized, name: fallback ?? "未知项目" };
}

function normalizeStatus(status?: string): Match["status"] {
  if (status === "running") return "live";
  if (status === "finished" || status === "canceled") return "complete";
  return "upcoming";
}

function scoreFor(results: PandaResult[] | undefined, teamId: number | undefined, status: Match["status"]) {
  if (!teamId || status === "upcoming") return null;
  return results?.find((result) => result.team_id === teamId)?.score ?? 0;
}

function formatBestOf(match: PandaMatch) {
  if (match.number_of_games && match.number_of_games > 0) return `BO${match.number_of_games}`;
  if (match.match_type?.startsWith("best_of")) return `BO${match.match_type.replace(/\D/g, "") || "?"}`;
  return "BO?";
}

function formatTimeLabel(value: string, status: Match["status"]) {
  if (status === "live") return "进行中";
  if (status === "complete") return "已结束";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function shortName(name: string | undefined, fallback: string) {
  return name?.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || fallback;
}

function colorFor(value: string) {
  const palette = ["#68b5ff", "#ff6474", "#ffb24b", "#71e7be", "#b9a8ff", "#ffe06f"];
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function platformFor(url?: string) {
  if (!url) return "官方直播待公布";
  if (url.includes("twitch.tv")) return "Twitch";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("huya.com")) return "虎牙直播";
  if (url.includes("douyu.com")) return "斗鱼直播";
  if (url.includes("bilibili.com")) return "哔哩哔哩";
  return "官方直播";
}
