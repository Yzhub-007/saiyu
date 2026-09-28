import type { Match } from "@/lib/esports-data";
import { TeamMark } from "./team-mark";

export function MatchTeamNames({ match, short = false }: { match: Match; short?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="inline-flex min-w-0 items-center gap-2">
        <TeamMark
          label={match.teamAShort}
          name={match.teamA}
          logo={match.teamALogo}
          color={match.teamAColor}
          size="sm"
        />
        <span className="break-words">{short ? match.teamAShort : match.teamA}</span>
      </span>
      <span className="text-subtle">vs</span>
      <span className="inline-flex min-w-0 items-center gap-2">
        <TeamMark
          label={match.teamBShort}
          name={match.teamB}
          logo={match.teamBLogo}
          color={match.teamBColor}
          size="sm"
        />
        <span className="break-words">{short ? match.teamBShort : match.teamB}</span>
      </span>
    </span>
  );
}
