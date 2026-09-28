export type ReferenceKind = "cs-map" | "lol-champion" | "dota-hero";

export type ReferenceItem = {
  id: string;
  kind: ReferenceKind;
  name: string;
  slug: string;
  imageUrl: string | null;
};

export type BasicPlayer = {
  id: string;
  name: string;
  realName: string | null;
  role: string | null;
  nationality: string | null;
  imageUrl: string | null;
  active: boolean;
};

export type ReferenceCatalog = {
  items: ReferenceItem[];
  fetchedAt: string;
  warnings: string[];
};

type RawReference = {
  id?: number;
  name?: string | null;
  localized_name?: string | null;
  slug?: string | null;
  image_url?: string | null;
  big_image_url?: string | null;
};

type RawPlayer = {
  id?: number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  nationality?: string | null;
  image_url?: string | null;
  active?: boolean;
};

const CACHE_MS = 6 * 60 * 60 * 1_000;
let catalogCache: (ReferenceCatalog & { expiresAt: number }) | null = null;
const rosterCache = new Map<string, { data: BasicPlayer[]; warning?: string; expiresAt: number }>();

export async function getReferenceCatalog(): Promise<ReferenceCatalog> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache;
  const sources = [
    { path: "/csgo/maps", kind: "cs-map" as const, label: "CS 地图" },
    { path: "/lol/champions", kind: "lol-champion" as const, label: "英雄联盟英雄" },
    { path: "/dota2/heroes", kind: "dota-hero" as const, label: "Dota 2 英雄" },
  ];
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const rows = await fetchPages<RawReference>(source.path, source.kind === "cs-map" ? 1 : 2);
      return rows.map((row): ReferenceItem | null => {
        if (!row.id) return null;
        const name = (source.kind === "dota-hero" ? row.localized_name : row.name)?.trim();
        if (!name) return null;
        return {
          id: String(row.id),
          kind: source.kind,
          name,
          slug: row.slug?.trim() || row.name?.trim() || String(row.id),
          imageUrl: safeImage(row.big_image_url) ?? safeImage(row.image_url),
        };
      }).filter((item): item is ReferenceItem => item !== null);
    }),
  );
  const warnings: string[] = [];
  const items = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    warnings.push(`${sources[index].label}暂时无法同步`);
    return [];
  }).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  const fetchedAt = new Date().toISOString();
  catalogCache = { items, warnings, fetchedAt, expiresAt: Date.now() + CACHE_MS };
  return catalogCache;
}

export async function listBasicPlayersForTeam(teamId: string, game: string) {
  const numericId = teamId.startsWith("panda-team-") ? teamId.slice("panda-team-".length) : "";
  const prefixes: Record<string, string> = { cs2: "csgo", lol: "lol", dota: "dota2", val: "valorant" };
  const prefix = prefixes[game];
  if (!prefix || !/^\d+$/.test(numericId)) {
    return { data: [] as BasicPlayer[], warning: "当前项目暂无可用的免费基础阵容接口" };
  }
  const key = `${prefix}:${numericId}`;
  const cached = rosterCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached;
  try {
    const rows = await requestJson<RawPlayer[]>(`/${prefix}/players?per_page=100&filter[team_id]=${numericId}`);
    const data = rows.flatMap((row): BasicPlayer[] => {
      if (!row.id || !row.name?.trim()) return [];
      const realName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || null;
      return [{
        id: `panda-player-${row.id}`,
        name: row.name.trim(),
        realName,
        role: row.role?.trim() || null,
        nationality: row.nationality?.trim() || null,
        imageUrl: safeImage(row.image_url),
        active: row.active !== false,
      }];
    }).sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
    const result = { data, ...(data.length ? {} : { warning: "数据源尚未公布这支战队的基础阵容" }), expiresAt: Date.now() + CACHE_MS };
    rosterCache.set(key, result);
    return result;
  } catch {
    const result = { data: [] as BasicPlayer[], warning: "基础阵容暂时无法同步", expiresAt: Date.now() + 5 * 60_000 };
    rosterCache.set(key, result);
    return result;
  }
}

async function fetchPages<T>(path: string, pageCount: number) {
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, index) => requestJson<T[]>(`${path}?per_page=100&page=${index + 1}`)),
  );
  return pages.flat();
}

async function requestJson<T>(path: string): Promise<T> {
  const token = process.env.PANDASCORE_TOKEN?.trim();
  if (!token) throw new Error("PANDASCORE_TOKEN is not configured");
  const url = new URL(path, "https://api.pandascore.co");
  let response = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 401 || response.status === 403) {
    url.searchParams.set("token", token);
    response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  }
  if (!response.ok) throw new Error(`PandaScore reference request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

function safeImage(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
