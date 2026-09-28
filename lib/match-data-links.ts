import type { Match } from "./esports-data";
import { getExternalDataSourcesForGame } from "./external-data-sources";

export type MatchDataLink = {
  label: string;
  description: string;
  url: string;
  kind: "official" | "provider" | "subscription" | "reference";
};

export function getMatchDataLinks(match: Match): MatchDataLink[] {
  const links: MatchDataLink[] = [];
  const officialUrl = safePublicUrl(match.streamUrl);

  if (officialUrl) {
    links.push({
      label: "赛事官方页面",
      description: "核对官方赛果、公告、回放和观赛入口",
      url: officialUrl,
      kind: "official",
    });
  }

  for (const source of getExternalDataSourcesForGame(match.game)) {
    if (source.url === officialUrl) continue;
    links.push({
      label: source.label,
      description: source.description,
      url: source.url,
      kind: source.sourceType === "official" ? "official" : "reference",
    });
  }

  links.push(
    {
      label: "PandaScore 数据范围",
      description: "查看本项目的赛程、赛果、地图与选手数据可用层级",
      url: "https://developers.pandascore.co/docs/plan-reference",
      kind: "provider",
    },
    {
      label: "开通详细赛后数据",
      description: "查看 Historical 套餐与实时数据订阅方案",
      url: "https://www.pandascore.co/pricing",
      kind: "subscription",
    },
  );

  return links;
}

function safePublicUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
