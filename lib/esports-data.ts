export type MatchStatus = "live" | "upcoming" | "complete";

export type MatchGame = {
  id: string;
  position: number;
  status: "live" | "upcoming" | "complete" | "canceled";
  winnerId: string | null;
  mapName?: string | null;
};

export type Match = {
  id: string;
  game: string;
  gameName: string;
  league: string;
  tournamentId: string;
  stage: string;
  status: MatchStatus;
  startsAt: string;
  timeLabel: string;
  bestOf: string;
  teamA: string;
  teamAShort: string;
  teamAId: string;
  teamAColor: string;
  teamALogo?: string | null;
  scoreA: number | null;
  teamB: string;
  teamBShort: string;
  teamBId: string;
  teamBColor: string;
  teamBLogo?: string | null;
  scoreB: number | null;
  detail: string;
  streamUrl: string;
  streamPlatform: string;
  language: string;
  freshness: string;
  games?: MatchGame[];
  scoreCoverage?: "not-covered" | "unavailable";
};

export const games = [
  { id: "lol", name: "英雄联盟", short: "LOL", color: "#68b5ff" },
  { id: "val", name: "无畏契约", short: "VAL", color: "#ff6474" },
  { id: "cs2", name: "CS2", short: "CS", color: "#ffb24b" },
  { id: "dota", name: "Dota 2", short: "D2", color: "#ff8779" },
  { id: "kog", name: "王者荣耀", short: "KOG", color: "#b9a8ff" },
  { id: "pel", name: "和平精英", short: "PEL", color: "#71e7be" },
  { id: "pubg", name: "PUBG", short: "PUBG", color: "#ffe06f" },
  { id: "mlbb", name: "MLBB", short: "ML", color: "#67ccff" },
];

export const matches: Match[] = [
  { id: "vct-edg-prx", game: "val", gameName: "无畏契约", league: "VCT 冠军赛", tournamentId: "vct-champions", stage: "淘汰赛 · 胜者组", status: "live", startsAt: "2026-09-26T07:00:00Z", timeLabel: "第 3 局 · 进行中", bestOf: "BO5", teamA: "EDward Gaming", teamAShort: "EDG", teamAId: "edg", teamAColor: "#ffb93f", scoreA: 1, teamB: "Paper Rex", teamBShort: "PRX", teamBId: "prx", teamBColor: "#ff5f69", scoreB: 1, detail: "源工重镇 · 8 : 6", streamUrl: "https://valorantesports.com/", streamPlatform: "VALORANT Esports", language: "中文 / English", freshness: "38 秒前" },
  { id: "lol-t1-blg", game: "lol", gameName: "英雄联盟", league: "全球总决赛", tournamentId: "worlds-2026", stage: "瑞士轮 · 第 3 轮", status: "upcoming", startsAt: "2026-09-26T11:00:00Z", timeLabel: "今天 19:00", bestOf: "BO3", teamA: "T1", teamAShort: "T1", teamAId: "t1", teamAColor: "#e33a42", scoreA: null, teamB: "Bilibili Gaming", teamBShort: "BLG", teamBId: "blg", teamBColor: "#61b8ff", scoreB: null, detail: "预计 2 小时 30 分", streamUrl: "https://lolesports.com/", streamPlatform: "LoL Esports", language: "中文 / English / 한국어", freshness: "3 分钟前" },
  { id: "cs-spirit-vitality", game: "cs2", gameName: "CS2", league: "ESL Pro League", tournamentId: "esl-pro-league", stage: "半决赛", status: "upcoming", startsAt: "2026-09-26T14:30:00Z", timeLabel: "今天 22:30", bestOf: "BO3", teamA: "Team Spirit", teamAShort: "TS", teamAId: "spirit", teamAColor: "#77a8ff", scoreA: null, teamB: "Vitality", teamBShort: "VIT", teamBId: "vitality", teamBColor: "#ffe04f", scoreB: null, detail: "图池待公布", streamUrl: "https://www.twitch.tv/eslcs", streamPlatform: "ESL CS", language: "English", freshness: "4 分钟前" },
  { id: "dota-liquid-falcons", game: "dota", gameName: "Dota 2", league: "DreamLeague", tournamentId: "dreamleague", stage: "小组赛 · 第 4 轮", status: "upcoming", startsAt: "2026-09-26T16:30:00Z", timeLabel: "明天 00:30", bestOf: "BO3", teamA: "Team Liquid", teamAShort: "TL", teamAId: "liquid", teamAColor: "#5ca8f7", scoreA: null, teamB: "Team Falcons", teamBShort: "FLC", teamBId: "falcons", teamBColor: "#9f8cff", scoreB: null, detail: "预计 2 小时", streamUrl: "https://www.youtube.com/@ESL_Dota2", streamPlatform: "ESL Dota 2", language: "English", freshness: "6 分钟前" },
  { id: "kog-ag-wolves", game: "kog", gameName: "王者荣耀", league: "KPL 年度总决赛", tournamentId: "kpl-finals", stage: "胜者组", status: "upcoming", startsAt: "2026-09-27T08:00:00Z", timeLabel: "周日 16:00", bestOf: "BO7", teamA: "成都AG超玩会", teamAShort: "AG", teamAId: "ag", teamAColor: "#ff4242", scoreA: null, teamB: "重庆狼队", teamBShort: "WOL", teamBId: "wolves", teamBColor: "#55a7ff", scoreB: null, detail: "全局 BP", streamUrl: "https://pvp.qq.com/", streamPlatform: "王者荣耀赛事", language: "中文", freshness: "12 分钟前" },
  { id: "mlbb-rrq-onic", game: "mlbb", gameName: "MLBB", league: "MPL Indonesia", tournamentId: "mpl-id", stage: "常规赛", status: "complete", startsAt: "2026-09-25T11:00:00Z", timeLabel: "昨天 19:00", bestOf: "BO3", teamA: "RRQ Hoshi", teamAShort: "RRQ", teamAId: "rrq", teamAColor: "#ffbb3d", scoreA: 2, teamB: "ONIC Esports", teamBShort: "ONIC", teamBId: "onic", teamBColor: "#ffe35c", scoreB: 1, detail: "已结束", streamUrl: "https://www.youtube.com/@MobileLegends5v5MOBA", streamPlatform: "MLBB Esports", language: "Bahasa / English", freshness: "昨天" },
];

export const powerRankings = [
  { rank: 1, id: "geng", name: "Gen.G", game: "英雄联盟", gameId: "lol", score: 94, trend: 2.4, form: 96, opponent: 93, map: 92, roster: 97, schedule: 88 },
  { rank: 2, id: "vitality", name: "Team Vitality", game: "CS2", gameId: "cs2", score: 91, trend: 1.1, form: 94, opponent: 90, map: 92, roster: 91, schedule: 86 },
  { rank: 3, id: "edg", name: "EDward Gaming", game: "无畏契约", gameId: "val", score: 88, trend: 3.8, form: 91, opponent: 86, map: 89, roster: 90, schedule: 81 },
  { rank: 4, id: "spirit", name: "Team Spirit", game: "CS2", gameId: "cs2", score: 86, trend: -0.7, form: 84, opponent: 90, map: 86, roster: 83, schedule: 89 },
  { rank: 5, id: "t1", name: "T1", game: "英雄联盟", gameId: "lol", score: 84, trend: 1.6, form: 82, opponent: 91, map: 83, roster: 89, schedule: 87 },
];

export const tournament = {
  id: "worlds-2026",
  name: "2026 全球总决赛",
  game: "英雄联盟",
  region: "全球",
  dates: "9 月 24 日—11 月 8 日",
  prize: "奖金待官方公布",
  location: "多城市巡回",
  stage: "瑞士轮",
  teams: 20,
  description: "全球赛区顶尖队伍争夺年度冠军。当前进入瑞士轮第三轮，三胜晋级、三负淘汰。",
  format: ["20 支队伍参加", "瑞士轮采用 BO1 / BO3 混合赛制", "八支队伍进入单败淘汰赛", "决赛采用 BO5"],
  standings: [
    { seed: 1, team: "Gen.G", record: "2–0", diff: "+3" },
    { seed: 2, team: "Bilibili Gaming", record: "2–0", diff: "+2" },
    { seed: 3, team: "T1", record: "1–1", diff: "+1" },
    { seed: 4, team: "G2 Esports", record: "1–1", diff: "0" },
  ],
};

export const teamProfiles: Record<string, { id: string; name: string; short: string; game: string; region: string; score: number; color: string; form: string; roster: string[]; strengths: string[] }> = {
  edg: { id: "edg", name: "EDward Gaming", short: "EDG", game: "无畏契约", region: "中国赛区", score: 88, color: "#ffb93f", form: "近 10 场 8 胜 2 负", roster: ["ZmjjKK", "CHICHOO", "nobody", "Smoggy", "Muggle"], strengths: ["进攻回合转换效率高", "残局处理稳定", "源工重镇近五场胜率 80%"] },
};

export function getMatch(id: string) { return matches.find((match) => match.id === id); }
export function getTeam(id: string) { return teamProfiles[id] ?? { id, name: id.toUpperCase(), short: id.slice(0, 3).toUpperCase(), game: "电竞项目", region: "国际赛区", score: 82, color: "#8d7cff", form: "近 10 场 6 胜 4 负", roster: ["选手 1", "选手 2", "选手 3", "选手 4", "选手 5"], strengths: ["近期状态稳定", "阵容磨合良好", "大赛经验丰富"] }; }
