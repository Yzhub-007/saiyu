"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronRight, Clock3, Flame, LayoutDashboard, Radio, Search, ShieldCheck, Swords, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Match } from "@/lib/esports-data";
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

function TeamMark({ label, color }: { label: string; color: string }) {
  return <span className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-white/10 text-xs font-black tracking-tight shadow-[inset_0_0_0_1px_rgb(255_255_255/5%)]" style={{ background: `linear-gradient(145deg, ${color}35, #101418 76%)`, color }}>{label}</span>;
}

function MatchRow({ match }: { match: Match }) {
  return (
    <a href={`/matches/${match.id}`} className="group grid w-full grid-cols-[116px_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/[0.07] px-4 py-4 text-left transition hover:bg-white/[0.035] max-md:grid-cols-[86px_minmax(0,1fr)]">
      <div><p className="text-sm font-semibold text-white">{localTime(match)}</p><p className="mt-1 text-xs text-zinc-500">{match.bestOf} · {match.gameName}</p></div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_34px_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center justify-end gap-3"><span className="truncate text-sm font-semibold text-zinc-200">{match.teamA}</span><TeamMark label={match.teamAShort} color={match.teamAColor} /></div>
        <span className="text-center font-mono text-sm text-zinc-600">VS</span>
        <div className="flex min-w-0 items-center gap-3"><TeamMark label={match.teamBShort} color={match.teamBColor} /><span className="truncate text-sm font-semibold text-zinc-200">{match.teamB}</span></div>
      </div>
      <div className="flex items-center gap-3 max-md:col-span-2 max-md:justify-end"><span className="text-xs text-zinc-500">{match.detail}</span><ChevronRight className="size-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-[#d8ff3e]" /></div>
    </a>
  );
}

export function EsportsDashboard({ initialMatches, dataSource }: { initialMatches: Match[]; dataSource: "pandascore" | "demo" }) {
  const matches = initialMatches;
  const [game, setGame] = useState("all");
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [follows, setFollows] = useState<Array<{ entityType: string; entityId: string }>>([]);
  const [followsLoaded, setFollowsLoaded] = useState(false);
  const filtered = useMemo(() => matches.filter((match) => game === "all" || match.game === game), [game, matches]);
  const liveMatches = filtered.filter((match) => match.status === "live");
  const upcoming = filtered.filter((match) => match.status === "upcoming" && (!selectedDay || dayKey(new Date(match.startsAt)) === selectedDay));
  const live = liveMatches[0] ?? filtered.find((match) => match.status === "upcoming") ?? filtered[0];
  const followed = filtered.filter((match) => follows.some((item) => (item.entityType === "team" && (item.entityId === match.teamAId || item.entityId === match.teamBId)) || (item.entityType === "tournament" && item.entityId === match.tournamentId) || (item.entityType === "game" && item.entityId === match.game)));
  const days = today ? Array.from({ length: 4 }, (_, index) => { const value = new Date(today); value.setHours(0, 0, 0, 0); value.setDate(value.getDate() + index); return value; }) : [];

  useEffect(() => {
    const dateTimer = window.setTimeout(() => {
      const value = new Date();
      setToday(value);
      setSelectedDay(dayKey(value));
    }, 0);
    fetch("/api/v1/follows").then(async (response) => response.ok ? response.json() as Promise<{ data?: Array<{ entityType: string; entityId: string }> }> : null).then((body) => { if (body?.data) setFollows(body.data); setFollowsLoaded(true); }).catch(() => setFollowsLoaded(true));
    return () => window.clearTimeout(dateTimer);
  }, []);

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
            {[[LayoutDashboard, "总览", "/"], [CalendarDays, "赛程", "/schedule"], [Trophy, "赛事", "/tournaments"], [Users, "战队", "/teams"]].map(([Icon, label, href], index) => { const NavIcon = Icon as typeof LayoutDashboard; return <Button key={label as string} variant="ghost" asChild className={index === 0 ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"}><a href={href as string}><NavIcon />{label as string}</a></Button>; })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="hidden border-white/10 bg-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white sm:flex"><a href="/search"><Search /> 搜索赛事 / 战队</a></Button>
            <Button asChild variant="ghost" size="icon" aria-label="通知" className="text-zinc-400 hover:bg-white/[0.05] hover:text-white"><a href="/notifications"><Bell /></a></Button>
            <Button asChild className="bg-[#d8ff3e] font-bold text-[#11150d] hover:bg-[#c6ed2f]"><a href="/account">账户</a></Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1520px] px-4 py-5 md:px-6 lg:py-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div><div className="mb-2 flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck className="size-3.5 text-[#8fa827]" /> {dataSource === "pandascore" ? "PandaScore 授权聚合数据" : "演示数据"} · 按浏览器本地时区显示 · 自动更新</div><h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">今天看什么</h1><p className="mt-1 text-sm text-zinc-500">已汇总 {matches.length} 场重点赛事</p></div>
            {days.length > 0 && <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-[#0e1216] p-1">{days.map((day, index) => { const key = dayKey(day); return <button key={key} onClick={() => setSelectedDay(key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${selectedDay === key ? "bg-[#d8ff3e] text-[#10140d]" : "text-zinc-500 hover:text-white"}`}>{index === 0 ? "今天" : day.toLocaleDateString("zh-CN", { weekday: "short" })} {day.getDate()}</button>; })}</div>}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              {live ? <section className="overflow-hidden rounded-2xl border border-[#d8ff3e]/20 bg-[radial-gradient(circle_at_84%_10%,rgba(216,255,62,0.08),transparent_34%),#101419] shadow-[0_20px_70px_rgb(0_0_0/20%)]">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3"><div className="flex items-center gap-2"><Badge className="gap-1.5 border border-[#ff5468]/20 bg-[#ff5468]/10 text-[#ff7180]"><span className="size-1.5 animate-pulse rounded-full bg-[#ff5468]" /> {live.status === "live" ? "LIVE" : "NEXT"}</Badge><span className="text-sm font-semibold text-zinc-300">{live.league}</span></div><span className="text-xs text-zinc-500">{live.freshness}</span></div>
                <div className="grid items-center gap-5 px-5 py-7 md:grid-cols-[1fr_auto_1fr] md:px-10">
                  <div className="flex items-center justify-center gap-4 md:justify-end"><div className="text-right"><p className="text-lg font-bold text-white md:text-xl">{live.teamA}</p><p className="mt-1 text-xs text-zinc-500">{live.gameName} · 战力样本待补充</p></div><TeamMark label={live.teamAShort} color={live.teamAColor} /></div>
                  <div className="text-center"><div className="font-mono text-4xl font-black tracking-tight text-white"><span>{live.scoreA ?? "–"}</span><span className="mx-3 text-zinc-700">:</span><span>{live.scoreB ?? "–"}</span></div><p className="mt-2 text-xs font-semibold text-[#d8ff3e]">{live.timeLabel}</p><p className="mt-1 text-xs text-zinc-600">{live.detail}</p></div>
                  <div className="flex items-center justify-center gap-4 md:justify-start"><TeamMark label={live.teamBShort} color={live.teamBColor} /><div><p className="text-lg font-bold text-white md:text-xl">{live.teamB}</p><p className="mt-1 text-xs text-zinc-500">{live.stage}</p></div></div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/[0.07] bg-black/10 px-5 py-4">{live.streamUrl && <Button asChild className="bg-[#d8ff3e] font-bold text-[#0f140d] hover:bg-[#c7ed33]"><a href={live.streamUrl} target="_blank" rel="noreferrer"><Radio /> 前往官方直播</a></Button>}<Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07] hover:text-white"><a href={`/matches/${live.id}`}><Swords /> 查看比赛详情</a></Button></div>
              </section> : <div className="rounded-2xl border border-white/[0.08] bg-[#101419]"><EmptyState label="当前筛选下暂无可展示的比赛。" /></div>}

              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101419]">
                <Tabs defaultValue="upcoming">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3"><TabsList variant="line" className="gap-5"><TabsTrigger value="upcoming" className="px-0 text-sm data-[state=active]:text-white">即将开始 <span className="text-zinc-600">{upcoming.length}</span></TabsTrigger><TabsTrigger value="live" className="px-0 text-sm data-[state=active]:text-white">直播中 <span className="text-[#ff7180]">{liveMatches.length}</span></TabsTrigger><TabsTrigger value="following" className="px-0 text-sm data-[state=active]:text-white">我的关注</TabsTrigger></TabsList><Button asChild variant="ghost" size="sm" className="text-zinc-500 hover:bg-white/[0.04] hover:text-white"><a href="/schedule">完整赛程 <ChevronRight /></a></Button></div>
                  <TabsContent value="upcoming" className="m-0">{upcoming.length ? upcoming.map((match) => <MatchRow key={match.id} match={match} />) : <EmptyState />}</TabsContent>
                  <TabsContent value="live" className="m-0">{liveMatches.length ? liveMatches.map((match) => <MatchRow key={match.id} match={match} />) : <EmptyState label="当前没有正在直播的比赛。" />}</TabsContent>
                  <TabsContent value="following" className="m-0">{followed.length ? followed.map((match) => <MatchRow key={match.id} match={match} />) : <EmptyState label={followsLoaded ? "尚未关注赛事或战队，可从详情页开始关注。" : "正在读取关注内容…"} />}</TabsContent>
                </Tabs>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-500">POWER INDEX</p><h2 className="mt-1 text-lg font-bold text-white">战力热榜</h2></div><Flame className="size-5 text-[#d8ff3e]" /></div>
                <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><p className="text-sm font-semibold text-zinc-300">正式榜单尚未发布</p><p className="mt-2 text-xs leading-5 text-zinc-600">有效系列赛和阵容数据达到门槛后才会显示分数。</p><a href="/rankings" className="mt-3 inline-flex text-xs font-semibold text-[#d8ff3e]">查看计算规则 <ChevronRight className="size-4" /></a></div>
              </section>
              <section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-zinc-500">NEXT UP</p><h2 className="mt-1 text-lg font-bold text-white">本周焦点</h2></div><Clock3 className="size-5 text-zinc-600" /></div>
                <div className="mt-5 border-l border-white/10 pl-4">{matches.filter((match) => match.status === "upcoming").slice(0, 3).map((match, index, rows) => <a href={`/matches/${match.id}`} key={match.id} className={`relative block pb-5 ${index === rows.length - 1 ? "pb-0" : ""}`}><span className="absolute -left-[21px] top-1 size-2 rounded-full border-2 border-[#101419] bg-zinc-600" /><p className="text-xs text-zinc-600">{new Date(match.startsAt).toLocaleString("zh-CN", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</p><p className="mt-1 text-sm font-medium leading-5 text-zinc-300">{match.league} · {match.teamAShort} vs {match.teamBShort}</p></a>)}</div>
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

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localTime(match: Match) {
  if (match.status === "live") return "进行中";
  if (match.status === "complete") return "已结束";
  return new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function RadarMark() {
  return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 4v8l5.6 5.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /></svg>;
}
