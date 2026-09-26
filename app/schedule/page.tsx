"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { games, matches } from "@/lib/esports-data";
import { SiteShell, TeamMark } from "../_components/site-shell";

export default function SchedulePage() {
  const [game, setGame] = useState("all");
  const visible = useMemo(() => matches.filter((match) => game === "all" || match.game === game), [game]);

  return (
    <SiteShell active="赛程">
      <main className="mx-auto max-w-[1380px] px-4 py-7 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold tracking-[0.16em] text-[#9ab529]">MATCH CALENDAR</p><h1 className="mt-2 text-3xl font-black text-white">赛程中心</h1><p className="mt-2 text-sm text-zinc-500">时间已按你的本地时区 UTC+8 显示</p></div>
          <Button variant="outline" asChild className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07]"><a href="/calendar/demo.ics"><CalendarPlus />订阅我的赛事日历</a></Button>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button onClick={() => setGame("all")} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${game === "all" ? "bg-[#d8ff3e] text-[#10140d]" : "border border-white/[0.08] bg-[#101419] text-zinc-500 hover:text-white"}`}>全部项目</button>
          {games.map((item) => <button key={item.id} onClick={() => setGame(item.id)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${game === item.id ? "border-white/20 bg-white/[0.09] text-white" : "border-white/[0.08] bg-[#101419] text-zinc-500 hover:text-white"}`}><span className="mr-2" style={{ color: item.color }}>●</span>{item.name}</button>)}
        </div>

        <Tabs defaultValue="list" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-white/[0.08] bg-[#101419] px-4 py-3">
            <div className="flex items-center gap-2"><Button size="icon-sm" variant="ghost" aria-label="上一天" className="text-zinc-500"><ChevronLeft /></Button><div className="min-w-36 text-center"><p className="text-sm font-bold text-white">2026 年 9 月 26 日</p><p className="text-xs text-zinc-600">星期六 · {visible.length} 场比赛</p></div><Button size="icon-sm" variant="ghost" aria-label="下一天" className="text-zinc-500"><ChevronRight /></Button></div>
            <TabsList className="bg-black/20"><TabsTrigger value="list">列表</TabsTrigger><TabsTrigger value="week">周视图</TabsTrigger><TabsTrigger value="month">月历</TabsTrigger></TabsList>
          </div>
          <TabsContent value="list" className="m-0 overflow-hidden rounded-b-2xl border-x border-b border-white/[0.08] bg-[#101419]">
            {visible.map((match) => <ScheduleRow key={match.id} match={match} />)}
            {!visible.length && <div className="grid min-h-52 place-items-center text-sm text-zinc-600">当前项目今天没有已确认的比赛</div>}
          </TabsContent>
          <TabsContent value="week" className="m-0 rounded-b-2xl border-x border-b border-white/[0.08] bg-[#101419] p-4">
            <div className="grid min-w-[760px] grid-cols-7 gap-2 overflow-x-auto">{["周一 21", "周二 22", "周三 23", "周四 24", "周五 25", "今天 26", "周日 27"].map((day, index) => <div key={day} className={`min-h-64 rounded-xl border p-3 ${index === 5 ? "border-[#d8ff3e]/35 bg-[#d8ff3e]/[0.04]" : "border-white/[0.06] bg-black/10"}`}><p className={`text-xs font-semibold ${index === 5 ? "text-[#d8ff3e]" : "text-zinc-600"}`}>{day}</p>{index === 5 && visible.slice(0, 3).map((match) => <a href={`/matches/${match.id}`} key={match.id} className="mt-3 block rounded-lg border border-white/[0.07] bg-white/[0.035] p-2"><p className="text-[11px] text-zinc-600">{match.timeLabel}</p><p className="mt-1 text-xs font-semibold text-zinc-300">{match.teamAShort} vs {match.teamBShort}</p></a>)}</div>)}</div>
          </TabsContent>
          <TabsContent value="month" className="m-0 rounded-b-2xl border-x border-b border-white/[0.08] bg-[#101419] p-4">
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-white/[0.06]">{["一", "二", "三", "四", "五", "六", "日"].map((d) => <div key={d} className="bg-[#11161b] p-2 text-center text-xs text-zinc-600">{d}</div>)}{Array.from({ length: 35 }, (_, i) => { const day = i - 1; const active = day === 26; return <div key={i} className={`min-h-20 bg-[#0d1115] p-2 ${active ? "ring-1 ring-inset ring-[#d8ff3e]/50" : ""}`}><span className={`text-xs ${active ? "font-bold text-[#d8ff3e]" : day > 0 && day <= 30 ? "text-zinc-500" : "text-zinc-800"}`}>{day > 0 && day <= 30 ? day : ""}</span>{active && <div className="mt-2 space-y-1"><span className="block truncate rounded bg-[#ff6474]/10 px-1 py-0.5 text-[10px] text-[#ff7b89]">VCT 直播中</span><span className="block truncate rounded bg-[#68b5ff]/10 px-1 py-0.5 text-[10px] text-[#8cc8ff]">全球总决赛</span></div>}</div>; })}</div>
          </TabsContent>
        </Tabs>
      </main>
    </SiteShell>
  );
}

function ScheduleRow({ match }: { match: (typeof matches)[number] }) {
  return <a href={`/matches/${match.id}`} className="group grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/[0.07] px-4 py-5 transition hover:bg-white/[0.035] max-md:grid-cols-[88px_minmax(0,1fr)]"><div><p className="flex items-center gap-1.5 text-sm font-bold text-white">{match.status === "live" && <Radio className="size-3.5 text-[#ff6474]" />}{match.timeLabel}</p><p className="mt-1 text-xs text-zinc-600">{match.bestOf}</p></div><div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2"><div className="flex min-w-0 items-center justify-end gap-2"><span className="truncate text-sm font-semibold text-zinc-300">{match.teamA}</span><TeamMark label={match.teamAShort} color={match.teamAColor} /></div><span className="text-center font-mono text-xs text-zinc-700">VS</span><div className="flex min-w-0 items-center gap-2"><TeamMark label={match.teamBShort} color={match.teamBColor} /><span className="truncate text-sm font-semibold text-zinc-300">{match.teamB}</span></div></div><div className="max-md:col-span-2 max-md:text-right"><p className="text-sm font-semibold text-zinc-400">{match.league}</p><p className="mt-1 flex items-center justify-end gap-1 text-xs text-zinc-600"><Clock3 className="size-3" />{match.stage}</p></div></a>;
}
