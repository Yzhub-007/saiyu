import type { MetadataRoute } from "next";
import { listMatches, listTeams, listTournaments } from "@/lib/matches-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL?.trim() || "https://saiyu-esports-hub.yuzhenjun233.chatgpt.site").replace(/\/$/, "");
  const [{ data: matches }, teams, tournaments] = await Promise.all([listMatches(), listTeams(), listTournaments()]);
  const staticPages = ["", "/schedule", "/rankings", "/tournaments", "/teams", "/search", "/privacy", "/terms"];
  return staticPages.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "hourly" : "daily" as "hourly" | "daily" }))
    .concat(matches.map((match) => ({ url: `${base}/matches/${match.id}`, lastModified: new Date(match.startsAt), changeFrequency: "hourly" as const })))
    .concat(teams.map((team) => ({ url: `${base}/teams/${team.id}`, lastModified: new Date(), changeFrequency: "daily" as const })))
    .concat(tournaments.map((tournament) => ({ url: `${base}/tournaments/${tournament.id}`, lastModified: new Date(), changeFrequency: "daily" as const })));
}
