import type { MetadataRoute } from "next";
import { matches } from "@/lib/esports-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://saiyu-esports-hub.yuzhenjun233.chatgpt.site";
  return ["", "/schedule", "/rankings", "/tournaments/worlds-2026", "/teams/edg"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "hourly" : "daily" as "hourly" | "daily" })).concat(matches.map((match) => ({ url: `${base}/matches/${match.id}`, lastModified: new Date(match.startsAt), changeFrequency: "hourly" as const })));
}
