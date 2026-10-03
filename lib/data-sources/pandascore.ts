import type { Match, MatchGame } from "../esports-data";
import type { MatchSourceAdapter, SourceRecord } from "./types";
import type { CollectionKind, CollectionResult } from "../match-collections";

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
  live?: { supported?: boolean };
  games?: Array<{
    id: number;
    position: number;
    status?: string;
    winner?: { id?: number | null };
    map?: { name?: string | null } | null;
  }>;
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
  "honor-of-kings": { id: "kog", name: "王者荣耀" },
  kog: { id: "kog", name: "王者荣耀" },
  pubg: { id: "pubg", name: "PUBG" },
  "pubg-mobile": { id: "pel", name: "和平精英" },
  "mobile-legends-bang-bang": { id: "mlbb", name: "MLBB" },
  mlbb: { id: "mlbb", name: "MLBB" },
};

export class PandaScoreAdapter implements MatchSourceAdapter {
  readonly id = "pandascore";

  private readonly token: string;
  constructor(token: string) { this.token = token; }

  async listUpcoming(): Promise<SourceRecord<Partial<Match>>[]> {
    return this.fetchCollection("upcoming");
  }

  async listCollections(): Promise<CollectionResult[]> {
    const kinds = ["running", "upcoming", "past"] as const;
    const collections = await Promise.allSettled([
      this.fetchCollection("running"),
      this.fetchCollection("upcoming"),
      // The free Fixtures plan exposes past match results. Keep the largest
      // supported page so the site can build a useful local result archive
      // without calling paid post-match/statistics endpoints.
      this.fetchCollection("past", 100),
    ]);
    return collections.map((result, index): CollectionResult => result.status === "fulfilled"
      ? { kind: kinds[index], ok: true, matches: result.value.map((row) => row.data), fetchedAt: result.value[0]?.fetchedAt ?? new Date().toISOString() }
      : { kind: kinds[index], ok: false, error: safeErrorMessage(result.reason) });
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

  private async fetchCollection(kind: CollectionKind, perPage = 100) {
    const sort = kind === "past" ? "&sort=-end_at" : "&sort=begin_at";
    const response = await this.request(`/matches/${kind}?per_page=${perPage}${sort}`);
    if (!response.ok) throw new Error(`PandaScore ${kind} request failed: ${response.status}`);
    const fetchedAt = new Date().toISOString();
    const rows = (await response.json()) as PandaMatch[];
    if (!Array.isArray(rows) || rows.some((row) => !row || !Number.isInteger(row.id) || row.id <= 0)) {
      throw new Error(`PandaScore ${kind} returned invalid data`);
    }
    return rows.map((row) => this.toRecord(row, fetchedAt));
  }

  private request(path: string) {
    if (!this.token) throw new Error("PANDASCORE_TOKEN is not configured");
    return fetchWithRetry(`https://api.pandascore.co${path}`, this.token);
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
        teamALogo: safeLogoUrl(teamA?.image_url),
        scoreA: scoreFor(row.results, teamA?.id, status),
        teamB: teamB?.name ?? "待定",
        teamBShort: teamB?.acronym ?? shortName(teamB?.name, "TBD"),
        teamBId,
        teamBColor: colorFor(teamBId),
        teamBLogo: safeLogoUrl(teamB?.image_url),
        scoreB: scoreFor(row.results, teamB?.id, status),
        detail: status === "live" ? "系列比分自动更新" : status === "complete" ? "已结束" : row.name ?? "赛前信息待更新",
        streamUrl: stream?.raw_url ?? "",
        streamPlatform: platformFor(stream?.raw_url),
        language: stream?.language || "以官方页面为准",
        freshness: fetchedAt,
        games: normalizeGames(row.games),
        // Coverage is not subscription permission. Do not imply that REST supplies live scores.
        scoreCoverage: row.live?.supported === false || game.id === "val" ? "not-covered" : "unavailable",
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
  const score = results?.find((result) => result.team_id === teamId)?.score;
  return typeof score === "number" && Number.isFinite(score) && score >= 0 ? score : null;
}

function safeLogoUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeGames(rows: PandaMatch["games"]): MatchGame[] {
  return (rows ?? []).filter((game) => Number.isFinite(game.id) && game.position > 0).map((game): MatchGame => ({
    id: String(game.id),
    position: game.position,
    status: game.status === "running" ? "live" : game.status === "finished" ? "complete" : game.status === "canceled" ? "canceled" : "upcoming",
    winnerId: game.winner?.id ? `panda-team-${game.winner.id}` : null,
    mapName: game.map?.name?.trim() || null,
  })).sort((a, b) => a.position - b.position);
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

async function fetchWithRetry(url: string, token: string) {
  // Two 8-second attempts fit inside the browser's 25-second request budget.
  // The shared deadline also bounds an auth fallback after a failed attempt.
  const deadline = AbortSignal.timeout(18_000);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.any([deadline, AbortSignal.timeout(8_000)]),
      });
      if (response.status === 401 || response.status === 403) {
        await response.body?.cancel();
        const fallbackUrl = new URL(url);
        fallbackUrl.searchParams.set("token", token);
        return fetch(fallbackUrl, {
          headers: { accept: "application/json" },
          signal: AbortSignal.any([deadline, AbortSignal.timeout(8_000)]),
        });
      }
      // Let the next scheduled refresh handle rate limits instead of retrying immediately.
      if (attempt === 0 && response.status >= 500) { await response.body?.cancel(); continue; }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === 1 || deadline.aborted) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("PandaScore request failed");
}

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "upstream unavailable";
  return message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/token=[^&\s]+/gi, "token=[redacted]").slice(0, 160);
}
