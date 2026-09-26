import type { Match } from "./esports-data";

function stamp(date: Date) { return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
function escape(value: string) { return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n"); }

export function matchEvent(match: Match) {
  const start = new Date(match.startsAt);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  return [
    "BEGIN:VEVENT",
    `UID:${match.id}@saiyu-esports-hub`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${match.teamA} vs ${match.teamB}｜${match.league}`)}`,
    `DESCRIPTION:${escape(`${match.stage} · ${match.bestOf} · 官方观赛：${match.streamUrl}`)}`,
    `URL:${match.streamUrl}`,
    "END:VEVENT",
  ].join("\r\n");
}

export function calendar(events: string[]) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Saiyu//Esports Calendar//ZH-CN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:赛域 · 我的电竞赛程", ...events, "END:VCALENDAR", ""].join("\r\n");
}
