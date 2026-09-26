import { EsportsDashboard } from "./esports-dashboard";
import { listMatches } from "@/lib/matches-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await listMatches();
  return <EsportsDashboard initialMatches={result.data} dataSource={result.meta.source} />;
}
