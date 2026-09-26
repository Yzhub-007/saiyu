export type PowerScoreInput = {
  seriesCount: number;
  updatedAt: string;
  form: number;
  opponent: number;
  map: number;
  roster: number;
  schedule: number;
};

export function calculatePowerScore(input: PowerScoreInput, now = new Date()) {
  const ageDays = (now.getTime() - new Date(input.updatedAt).getTime()) / 86_400_000;
  if (input.seriesCount < 5 || ageDays > 60) return { score: null, eligible: false, reason: input.seriesCount < 5 ? "insufficient_sample" : "stale_data" } as const;
  const score = input.form * 0.35 + input.opponent * 0.25 + input.map * 0.2 + input.roster * 0.1 + input.schedule * 0.1;
  return { score: Math.round(score), eligible: true, reason: null } as const;
}
