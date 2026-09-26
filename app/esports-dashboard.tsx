"use client";

import { useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronRight, Clock3, Flame, LayoutDashboard, Radio, Search, ShieldCheck, Swords, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebMcpTools } from "./webmcp-tools";

const games = [
  { id: "all", short: "ALL", name: "全部赛事", tone: "bg-[#d8ff3e] text-[#10150d]" },
  { id: "lol", short: "LOL", name: "英雄联盟", tone: "bg-[#18243a] text-[#8cc8ff]" },
  { id: "val", short: "VAL", name: "无畏契约", tone: "bg-[#33181d] text-[#ff6474]" },
  { id: "cs2", short: "CS", name: "CS2", tone: "bg-[#2d2215] text-[#ffb24b]" },
  { id: "dota", short: "D2", name: "Dota 2", tone: "bg-[#301719] text-[#ff8779]" },
  { id: "kog", short: "KOG", name: "王者荣耀", tone: "bg-[#22203b] text-[#b9a8ff]" },
  { id: "pel", short: "PEL", name: "和平精英", tone: "bg-[#19352f] text-[#71e7be]" },
  { id: "pubg", short: "PUBG", name: "PUBG", tone: "bg-[#332c16] text-[#ffe06f]" },
  { id: "mlbb", short: "ML", name: "MLBB", tone: "bg-[#152c3b] text-[#67ccff]" },
];

const matches = [
  { id: "vct-edg-prx", game: "val", gameName: "无畏契约", league: "VCT 冠军赛 · 淘汰赛", status: "live", time: "第 3 局 · 进行中", bestOf: "BO5", teamA: "EDward Gaming", teamAShort: "EDG", teamAColor: "#ffb93f", scoreA: 1, teamB: "Paper Rex", teamBShort: "PRX", teamBColor: "#ff5f69", scoreB: 1, map: "源工重镇 · 8 : 6", viewers: "42.8 万" },
  { id: "lol-t1-blg", game: "lol", gameName: "英雄联盟", league: "全球总决赛 · 瑞士轮", status: "upcoming", time: "今天 19:00", bestOf: "BO3", teamA: "T1", teamAShort: "T1", teamAColor: "#e33a42", scoreA: null, teamB: "Bilibili Gaming", teamBShort: "BLG", teamBColor: "#61b8ff", scoreB: null, map: "预计 2 小时 30 分", viewers: "已关注 18.2 万" },
  { id: "cs-spirit-vitality", game: "cs2", gameName: "CS2", league: "ESL Pro League · 半决赛", status: "upcoming", time: "今天 22:30", bestOf: "BO3", teamA: "Team Spirit", teamAShort: "TS", teamAColor: "#77a8ff", scoreA: null, teamB: "Vitality", teamBShort: "VIT", teamBColor: "#ffe04f", scoreB: null, map: "图池待公布", viewers: "热度上升中" },
  { id: "dota-liquid-falcons", game: "dota", gameName: "Dota 2", league: "DreamLeague · 小组赛", status: "upcoming", time: "明天 00:30", bestOf: "BO3", teamA: "Team Liquid", teamAShort: "TL", teamAColor: "#5ca8f7", scoreA: null, teamB: "Team Falcons", teamBShort: "FLC", teamBColor: "#9f8cff", scoreB: null, map: "预计 2 小时", viewers: "国际流" },
];

const rankings = [
  { rank: 1, name: "Gen.G", game: "英雄联盟", score: 94, trend: "+2.4" },
  { rank: 2, name: "Team Vitality", game: "CS2", score: 91, trend: "+1.1" },
  { rank: 3, name: "EDward Gaming", game: "无畏契约", score: 88, trend: "+3.8" },
];

function TeamMark({ label, color }: { label: string; color: string }) {
  return <span className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-white/10 text-xs font-black tracking-tight shadow-[inset_0_0_0_1px_rgb(255_255_255/5%)]" style={{ background: `linear-gradient(145deg, ${color}35, #101418 76%)`, color }}>{label}</span>;
}

function MatchRow({ match }: { match: (typeof matches)[number] }) {
  return (
    <a href={`/matches/${match.id}`} className="group grid w-full grid-cols-[116px_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/[0.07] px-4 py-4 text-left transition hover:bg-white/[0.035] max-md:grid-cols-[86px_minmax(0,1fr)]">
      <div><p className="text-sm font-semibold text-white">{match.time}</p><p className="mt-1 text-xs text-zinc-500">{match.bestOf} · {match.gameName}</p></div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_34px_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center justify-end gap-3"><span className="truncate text-sm font-semibold text-zinc-200">{match.teamA}</span><TeamMark label={match.teamAShort} color={match.teamAColor} /></div>
        <span className="text-center font-mono text-sm text-zinc-600">VS</span>
        <div className="flex min-w-0 items-center gap-3"><TeamMark label={match.teamBShort} color={match.teamBColor} /><span className="truncate text-sm font-semibold text-zinc-200">{match.teamB}</span></div>
      </div>
      <div className="flex items-center gap-3 max-md:col-span-2 max-md:justify-end"><span className="text-xs text-zinc-500">{match.map}</span><ChevronRight className="size-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-[#d8ff3e]" /></div>
    </a>
  );
}

export function EsportsDashboard() {
  const [game, setGame] = useState("all");
  const filtered = useMemo(() => matches.filter((match) => game === "all" || match.game === game), [game]);
  const live = matches[0];

  return (
    <SidebarProvider defaultOpen>
      <WebMcpTools onFilter={setGame} />
      <Sidebar collapsible="icon" className="border-r border-white/[0.08] bg-[#090c0f]">
        <SidebarHeader className="h-[74px] justify-center border-b border-white/[0.08] px-3">
          <div className="flex items-center gap-3 overflow-hidden px-1">
            <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-[#d8ff3e] text-[#0b0e10]"><RadarMark /></div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="text-base font-black tracking-[0.18em] text-white">赛域</p><p className="text-[10px] font-medium tracking-[0.16em] text-zinc-500">MATCH CONTROL</p></div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] tracking-[0.18em] text-zinc-600">比赛项目</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {games.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={game === item.id} tooltip={item.name} onClick={() => setGame(item.id)} className="h-11 rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white data-[active=true]:bg-white/[0.08] data-[active=true]:text-white">
                      <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-[9px] font-black ${item.tone}`}>{item.short}</span><span className="font-medium">{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/[0.08] p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2 group-data-[collapsible=icon]:justify-center"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#d8ff3e]/10 text-xs font-bold text-[#d8ff3e]">访</span><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-zinc-200">访客模式</p><p className="truncate text-[11px] text-zinc-600">登录同步关注</p></div></div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#0b0e11] text-zinc-100">
        <header className="sticky top-0 z-30 flex h-[74px] items-center gap-3 border-b border-white/[0.08] bg-[#0b0e11]/90 px-4 backdrop-blur-xl md:px-6">
          <SidebarTrigger className="text-zinc-400 hover:bg-white/[0.06] hover:text-white" />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
            {[[LayoutDashboard, "总览", "/"], [CalendarDays, "赛程", "/schedule"], [Trophy, "赛事", "/tournaments/worlds-2026"], [Users, "战队", "/teams/edg"]].map(([Icon, label, href], index) => { const NavIcon = Icon as typeof LayoutDashboard; return <Button key={label as string} variant="ghost" asChild className={index === 0 ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"}><a href={href as string}><NavIcon />{label as string}</a></Button>; })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="hidden border-white/10 bg-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white sm:flex"><Search /> 搜索赛事 / 战队</Button>
            <Button variant="ghost" size="icon" aria-label="通知" className="text-zinc-400 hover:bg-white/[0.05] hover:text-white"><Bell /></Button>
            <Button asChild className="bg-[#d8ff3e] font-bold text-[#11150d] hover:bg-[#c6ed2f]"><a href="/account">登录</a></Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1520px] px-4 py-5 md:px-6 lg:py-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div><div className="mb-2 flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck className="size-3.5 text-[#8fa827]" /> 数据演示 · 本地时区 UTC+8 · 刚刚更新</div><h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">今天看什么</h1><p className="mt-1 text-sm text-zinc-500">9 月 26 日，星期六 · 12 场重点赛事</p></div>
            <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-[#0e1216] p-1">
              {["周五 25", "今天 26", "周日 27", "周一 28"].map((day, index) => <button key={day} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${index === 1 ? "bg-[#d8ff3e] text-[#10140d]" : "text-zinc-500 hover:text-white"}`}>{day}</button>)}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              <section className="overflow-hidden rounded-2xl border border-[#d8ff3e]/20 bg-[radial-gradient(circle_at_84%_10%,rgba(216,255,62,0.08),transparent_34%),#101419] shadow-[0_20px_70px_rgb(0_0_0/20%)]">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3"><div className="flex items-center gap-2"><Badge className="gap-1.5 border border-[#ff5468]/20 bg-[#ff5468]/10 text-[#ff7180]"><span className="size-1.5 animate-pulse rounded-full bg-[#ff5468]" /> LIVE</Badge><span className="text-sm font-semibold text-zinc-300">{live.league}</span></div><span className="text-xs text-zinc-500">{live.viewers} 人正在关注</span></div>
                <div className="grid items-center gap-5 px-5 py-7 md:grid-cols-[1fr_auto_1fr] md:px-10">
                  <div className="flex items-center justify-center gap-4 md:justify-end"><div className="text-right"><p className="text-lg font-bold text-white md:text-xl">{live.teamA}</p><p className="mt-1 text-xs text-zinc-500">中国赛区 · 战力 88</p></div><TeamMark label={live.teamAShort} color={live.teamAColor} /></div>
                  <div className="text-center"><div className="font-mono text-4xl font-black tracking-tight text-white"><span>{live.scoreA}</span><span className="mx-3 text-zinc-700">:</span><span>{live.scoreB}</span></div><p className="mt-2 text-xs font-semibold text-[#d8ff3e]">{live.time}</p><p className="mt-1 text-xs text-zinc-600">{live.map}</p></div>
                  <div className="flex items-center justify-center gap-4 md:justify-start"><TeamMark label={live.teamBShort} color={live.teamBColor} /><div><p className="text-lg font-bold text-white md:text-xl">{live.teamB}</p><p className="mt-1 text-xs text-zinc-500">太平洋赛区 · 战力 86</p></div></div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/[0.07] bg-black/10 px-5 py-4"><Button asChild className="bg-[#d8ff3e] font-bold text-[#0f140d] hover:bg-[#c7ed33]"><a href="https://valorantesports.com/" target="_blank" rel="noreferrer"><Radio /> 前往官方直播</a></Button><Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07] hover:text-white"><a href="/matches/vct-edg-prx"><Swords /> 查看战力对比</a></Button></div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101419]">
                <Tabs defaultValue="upcoming">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3"><TabsList variant="line" className="gap-5"><TabsTrigger value="upcoming" className="px-0 text-sm data-[state=active]:text-white">即将开始 <span className="text-zinc-600">11</span></TabsTrigger><TabsTrigger value="live" className="px-0 text-sm data-[state=active]:text-white">直播中 <span className="text-[#ff7180]">1</span></TabsTrigger><TabsTrigger value="following" className="px-0 text-sm data-[state=active]:text-white">我的关注</TabsTrigger></TabsList><Button asChild variant="ghost" size="sm" className="text-zinc-500 hover:bg-white/[0.04] hover:text-white"><a href="/schedule">完整赛程 <ChevronRight /></a></Button></div>
                  <TabsContent value="upcoming" className="m-0">{filtered.filter((m) => m.status === "upcoming").length ? filtered.filter((m) => m.status === "upcoming").map((match) => <MatchRow key={match.id} match={match} />) : <EmptyState />}</TabsContent>
                  <TabsContent value="live" className="m-0"><MatchRow match={live} /></TabsContent>
                  <TabsContent value="following" className="m-0"><EmptyState label="登录后，这里会显示你关注的战队与赛事。" /></TabsContent>
                </Tabs>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-500">POWER INDEX</p><h2 className="mt-1 text-lg font-bold text-white">战力热榜</h2></div><Flame className="size-5 text-[#d8ff3e]" /></div>
                <div className="space-y-1">{rankings.map((team) => <div key={team.name} className="grid grid-cols-[30px_1fr_auto] items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.035]"><span className="font-mono text-sm font-bold text-zinc-600">0{team.rank}</span><div><p className="text-sm font-bold text-zinc-200">{team.name}</p><p className="text-xs text-zinc-600">{team.game}</p></div><div className="text-right"><p className="font-mono text-lg font-black text-white">{team.score}</p><p className="text-[11px] text-[#8fa827]">{team.trend}</p></div></div>)}</div>
                <p className="mt-3 border-t border-white/[0.07] pt-4 text-xs leading-5 text-zinc-600">根据近期状态、对手强度、地图表现与阵容稳定度计算，不代表胜率。</p>
              </section>
              <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-500">NEXT UP</p><h2 className="mt-1 text-lg font-bold text-white">本周焦点</h2></div><Clock3 className="size-5 text-zinc-600" /></div>
                <div className="mt-5 border-l border-white/10 pl-4">{[["今天", "19:00", "全球总决赛 · T1 vs BLG"], ["周日", "16:00", "KPL 年度总决赛 · 胜者组"], ["周一", "00:30", "DreamLeague · 小组赛"]].map(([day, time, event], index) => <div key={event} className={`relative pb-5 ${index === 2 ? "pb-0" : ""}`}><span className="absolute -left-[21px] top-1 size-2 rounded-full border-2 border-[#101419] bg-zinc-600" /><p className="text-xs text-zinc-600">{day} · {time}</p><p className="mt-1 text-sm font-medium leading-5 text-zinc-300">{event}</p></div>)}</div>
              </section>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EmptyState({ label = "当前筛选下没有即将开始的比赛。" }: { label?: string }) {
  return <div className="grid min-h-40 place-items-center p-6 text-center text-sm text-zinc-600">{label}</div>;
}

function RadarMark() {
  return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 4v8l5.6 5.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /></svg>;
}
