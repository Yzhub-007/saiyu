import { listMatches } from "@/lib/matches-service";
import { ScheduleClient } from "./schedule-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "赛程中心｜赛域" };

export default async function SchedulePage() {
  const result = await listMatches();
  return <ScheduleClient initialMatches={result.data} source={result.meta.source} generatedAt={result.meta.generatedAt} renderedAt={new Date().toISOString()} stale={result.meta.stale} sync={result.meta.sync} />;
}
