import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { listTeams } from "@/lib/matches-service";
import { SiteShell, TeamMark } from "../_components/site-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "战队资料｜赛域" };

export default async function TeamsPage() {
  const teams = (await listTeams()).sort((a, b) => b.matches.length - a.matches.length);
  return <SiteShell active="战队"><main className="mx-auto max-w-[1180px] px-4 py-7 md:px-6"><div className="flex items-center gap-3"><Users className="size-6 text-[#d8ff3e]" /><div><p className="text-xs font-semibold tracking-[0.16em] text-[#9ab529]">TEAMS</p><h1 className="mt-1 text-3xl font-black text-white">战队资料</h1></div></div><p className="mt-3 text-sm text-zinc-500">仅展示当前授权赛程中已确认的战队，不补写未经验证的阵容或成绩。</p><section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{teams.map((team) => <Link key={team.id} href={`/teams/${team.id}`} className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#101419] p-4 transition hover:border-[#d8ff3e]/25 hover:bg-white/[0.03]"><TeamMark label={team.short} color={team.color} /><div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{team.name}</p><p className="mt-1 text-xs text-zinc-600">{team.gameName} · {team.matches.length} 场</p></div><ChevronRight className="size-4 text-zinc-700" /></Link>)}</section></main></SiteShell>;
}
