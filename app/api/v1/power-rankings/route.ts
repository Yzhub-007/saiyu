import { powerRankings } from "@/lib/esports-data";
import { calculatePowerScore } from "@/lib/power-score";

export async function GET(request: Request) {
  const game = new URL(request.url).searchParams.get("game");
  const data = powerRankings.filter((team) => !game || team.gameId === game).map((team) => ({ ...team, calculation: calculatePowerScore({ seriesCount: 10, updatedAt: new Date().toISOString(), form: team.form, opponent: team.opponent, map: team.map, roster: team.roster, schedule: team.schedule }) }));
  return Response.json({ data, meta: { methodology: "form:35,opponent:25,map:20,roster:10,schedule:10", demo: true } });
}
