export type ExternalDataSource = {
  games: string[];
  gameName: string;
  label: string;
  description: string;
  url: string;
  sourceType: "official" | "third-party";
};

export const externalDataSources: ExternalDataSource[] = [
  {
    games: ["kog"],
    gameName: "王者荣耀",
    label: "王者荣耀赛事数据",
    description: "腾讯官方赛事数据入口，可查看赛事、赛程与相关比赛资料。",
    url: "https://pvp.qq.com/matchdata/index.html",
    sourceType: "official",
  },
  {
    games: ["pel"],
    gameName: "和平精英",
    label: "和平精英赛事中心",
    description: "腾讯官方赛事中心，提供赛程、积分、战队和选手数据。",
    url: "https://gp.qq.com/act/a20210207match_data/match.html",
    sourceType: "official",
  },
  {
    games: ["cs2"],
    gameName: "CS2",
    label: "HLTV CS2 赛事资料",
    description: "专业第三方资料站，提供赛程、赛果、地图、战队和选手统计。",
    url: "https://www.hltv.org/",
    sourceType: "third-party",
  },
  {
    games: ["dota"],
    gameName: "Dota 2",
    label: "Dota 2 官方站点",
    description: "Valve 官方入口，可查看游戏资讯、英雄资料与官方电竞内容。",
    url: "https://www.dota2.com/",
    sourceType: "official",
  },
];

export function getExternalDataSourcesForGame(game: string) {
  return externalDataSources.filter((source) => source.games.includes(game));
}
