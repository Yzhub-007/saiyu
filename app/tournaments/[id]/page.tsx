import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Globe2, MapPin, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { matches, tournament } from "@/lib/esports-data";
import { SiteShell, TeamMark } from "../../_components/site-shell";

export const metadata = { title: "2026 全球总决赛｜赛域", description: "赛事结构、积分榜、重点赛程与中文观赛手册。" };

export default function TournamentPage() {
  const eventMatches = matches.filter((match) => match.tournamentId === tournament.id);
  return (
    <SiteShell active="赛事">
      <main className="mx-auto max-w-[1320px] px-4 py-7 md:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_80%_0%,rgba(104,181,255,0.14),transparent_35%),linear-gradient(135deg,#121820,#0f1318)] p-6 md:p-9">
          <div className="absolute right-8 top-8 hidden size-32 place-items-center rounded-full border border-white/[0.06] text-5xl font-black text-[#68b5ff]/15 lg:grid">W26</div>
          <Badge className="border border-[#68b5ff]/20 bg-[#68b5ff]/10 text-[#8cc8ff]">进行中 · {tournament.stage}</Badge>
          <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">{tournament.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{tournament.description}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500"><span className="flex items-center gap-2"><CalendarDays className="size-4" />{tournament.dates}</span><span className="flex items-center gap-2"><MapPin className="size-4" />{tournament.location}</span><span className="flex items-center gap-2"><Users className="size-4" />{tournament.teams} 支队伍</span><span className="flex items-center gap-2"><Globe2 className="size-4" />{tournament.region}</span></div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-600">UPCOMING MATCHES</p><h2 className="mt-1 text-xl font-bold text-white">重点赛程</h2></div><Button size="sm" variant="ghost" asChild className="text-zinc-500"><Link href="/schedule">完整赛程<ChevronRight /></Link></Button></div><div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">{eventMatches.length ? eventMatches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 border-b border-white/[0.07] px-4 py-4 hover:bg-white/[0.03]"><div><p className="text-sm font-bold text-white">{match.timeLabel}</p><p className="text-xs text-zinc-600">{match.bestOf}</p></div><div className="flex items-center justify-center gap-3"><span className="text-sm font-semibold text-zinc-300">{match.teamAShort}</span><TeamMark label={match.teamAShort} color={match.teamAColor} /><span className="font-mono text-xs text-zinc-700">VS</span><TeamMark label={match.teamBShort} color={match.teamBColor} /><span className="text-sm font-semibold text-zinc-300">{match.teamBShort}</span></div><ChevronRight className="size-4 text-zinc-700" /></Link>) : <div className="p-8 text-center text-sm text-zinc-600">后续赛程将在对阵确认后更新</div>}</div></section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6"><div className="flex items-center gap-3"><BookOpen className="size-5 text-[#d8ff3e]" /><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-600">VIEWING GUIDE</p><h2 className="mt-1 text-xl font-bold text-white">观赛手册</h2></div></div><div className="mt-6 grid gap-6 md:grid-cols-2"><div><h3 className="text-sm font-bold text-zinc-200">赛制速览</h3><ol className="mt-3 space-y-3">{tournament.format.map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-500"><span className="font-mono text-[#8fa827]">0{index + 1}</span>{item}</li>)}</ol></div><div><h3 className="text-sm font-bold text-zinc-200">本轮看点</h3><div className="mt-3 space-y-3 text-sm leading-6 text-zinc-500"><p>BLG 与 Gen.G 争夺首批晋级席位；T1 需要在中段轮次稳定积分。</p><p>瑞士轮第三轮开始出现 BO3 淘汰或晋级赛，阵容深度与版本适应更加关键。</p><p>赛程时间均按浏览器时区转换；直播语言和地区限制以官方页面为准。</p></div></div></div></section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><div className="flex items-center gap-2"><Trophy className="size-5 text-[#68b5ff]" /><h2 className="text-lg font-bold text-white">当前排名</h2></div><div className="mt-4"><div className="grid grid-cols-[40px_1fr_60px_46px] px-2 pb-2 text-[11px] text-zinc-700"><span>#</span><span>战队</span><span>战绩</span><span>净胜</span></div>{tournament.standings.map((row) => <div key={row.team} className="grid grid-cols-[40px_1fr_60px_46px] items-center border-t border-white/[0.06] px-2 py-3 text-sm"><span className="font-mono text-zinc-600">0{row.seed}</span><span className="font-semibold text-zinc-200">{row.team}</span><span className="font-mono text-zinc-400">{row.record}</span><span className="font-mono text-[#8fa827]">{row.diff}</span></div>)}</div></section>
            <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><h2 className="text-lg font-bold text-white">赛事信息</h2><div className="mt-4 space-y-4">{[["比赛项目", tournament.game], ["当前阶段", tournament.stage], ["参赛队伍", `${tournament.teams} 支`], ["奖金", tournament.prize]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-sm"><span className="text-zinc-600">{label}</span><span className="text-right text-zinc-300">{value}</span></div>)}</div></section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
