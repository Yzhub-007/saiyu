"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CalendarDays, ChevronRight, Clock3, Flame, LayoutDashboard, Radio, Search, ShieldCheck, Swords, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Match } from "@/lib/esports-data";
import { WebMcpTools } from "./webmcp-tools";
import { ThemeToggle } from "./_components/theme-toggle";
import { TeamMark } from "./_components/team-mark";
import { MatchTeamNames } from "./_components/match-team-names";
import { GameScorePanel } from "./_components/game-score-panel";
import { formatMatchUpdateTime, useMatchUpdates } from "./_components/use-match-updates";

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

function MatchRow({ match }: { match: Match }) {
  return (
    <a href={`/matches/${match.id}`} className="match-row group grid w-full grid-cols-[116px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4 text-left hover:bg-surface-hover max-lg:grid-cols-1">
      <div><p className="text-sm font-semibold text-foreground">{localTime(match)}</p><p className="mt-1 text-xs text-muted-foreground">{match.bestOf} · {match.gameName}</p></div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center justify-end gap-3"><span className="truncate text-sm font-semibold text-foreground">{match.teamA}</span><TeamMark label={match.teamAShort} color={match.teamAColor} logo={match.teamALogo} name={match.teamA} /></div>
        <span className="whitespace-nowrap text-center font-mono text-sm text-soft" aria-label={match.status === "upcoming" ? "即将对阵" : `系列比分 ${match.scoreA ?? "–"} 比 ${match.scoreB ?? "–"}`}>{match.status === "upcoming" ? "VS" : <>{match.scoreA ?? "–"} : {match.scoreB ?? "–"}<span className="block font-sans text-[10px] text-subtle">系列比分</span></>}</span>
        <div className="flex min-w-0 items-center gap-3"><TeamMark label={match.teamBShort} color={match.teamBColor} logo={match.teamBLogo} name={match.teamB} /><span className="truncate text-sm font-semibold text-foreground">{match.teamB}</span></div>
      </div>
      <div className="flex min-w-0 items-center gap-3 max-lg:justify-end lg:max-w-36"><span className="truncate text-xs text-muted-foreground" title={match.detail}>{match.detail}</span><ChevronRight className="size-4 shrink-0 text-subtle group-hover:text-brand" /></div>
    </a>
  );
}

export function EsportsDashboard({ initialMatches, dataSource, stale: initialStale }: { initialMatches: Match[]; dataSource: "pandascore" | "demo"; stale: boolean }) {
  const { matches, stale, updatedAt } = useMatchUpdates(initialMatches, { source: dataSource, stale: initialStale });
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
      <Sidebar collapsible="icon" className="dashboard-sidebar border-r border-border bg-sidebar">
        <SidebarHeader className="h-[74px] justify-center border-b border-border px-3">
          <div className="flex items-center gap-3 overflow-hidden px-1">
            <div className="brand-mark relative grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><RadarMark /></div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="text-base font-black tracking-[0.18em] text-foreground">赛域</p><p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground">MATCH CONTROL</p></div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] tracking-[0.18em] text-subtle">比赛项目</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {games.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={game === item.id} tooltip={item.name} onClick={() => setGame(item.id)} className="h-11 rounded-xl text-soft hover:bg-surface-hover hover:text-foreground data-[active=true]:bg-surface-hover data-[active=true]:text-foreground">
                      <span className={`game-mark grid size-7 shrink-0 place-items-center rounded-lg font-black ${item.tone}`}>{item.short}</span><span className="font-medium">{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl bg-surface-hover p-2 group-data-[collapsible=icon]:justify-center"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-brand">访</span><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-foreground">访客模式</p><p className="truncate text-[11px] text-subtle">登录同步关注</p></div></div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="dashboard-content min-w-0 text-foreground">
        <header className="site-header glass-toolbar sticky top-0 z-30 flex h-[74px] items-center gap-3 border-b px-4 md:px-6">
          <SidebarTrigger className="text-soft hover:bg-surface-hover hover:text-foreground" />
          <a href="/" className="text-sm font-bold tracking-widest md:hidden">赛域</a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
            {[[LayoutDashboard, "总览", "/"], [CalendarDays, "赛程", "/schedule"], [Trophy, "赛事", "/tournaments"], [Users, "战队", "/teams"]].map(([Icon, label, href], index) => { const NavIcon = Icon as typeof LayoutDashboard; return <Button key={label as string} variant="ghost" asChild className={index === 0 ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}><a href={href as string}><NavIcon />{label as string}</a></Button>; })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="glass-control text-soft hover:text-foreground"><a href="/search" aria-label="搜索赛事或战队"><Search /><span className="hidden xl:inline">搜索赛事 / 战队</span></a></Button>
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" aria-label="通知" className="text-soft hover:bg-surface-hover hover:text-foreground"><a href="/notifications"><Bell /></a></Button>
            <Button asChild className="bg-primary font-bold text-primary-foreground hover:bg-brand-hover"><a href="/account">账户</a></Button>
          </div>
        </header>
        <nav className="glass-toolbar flex overflow-x-auto border-b px-4 lg:hidden" aria-label="移动端主导航">
          {[["总览", "/"], ["赛程", "/schedule"], ["赛事", "/tournaments"], ["战队", "/teams"], ["战力", "/rankings"]].map(([label, href], index) => <a key={href} href={href} aria-current={index === 0 ? "page" : undefined} className={`shrink-0 px-4 py-3 text-sm ${index === 0 ? "border-b-2 border-brand font-semibold text-brand" : "text-muted-foreground"}`}>{label}</a>)}
        </nav>

        <div className="mx-auto w-full max-w-[1520px] px-4 py-6 md:px-7 lg:py-8">
          {stale && matches.length > 0 && <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/[0.07] px-4 py-3 text-sm text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>实时数据暂时不可用，当前展示最后一次成功同步的赛程。</p></div>}
          {stale && matches.length === 0 && <div className="mb-5 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/[0.07] px-4 py-3 text-sm text-danger"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>赛事数据源暂时不可用，请稍后刷新。我们不会用演示比赛替代正式数据。</p></div>}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-brand" /> {dataSource === "pandascore" ? "PandaScore 授权聚合数据" : "演示数据"} · 本地时区</div><h1 className="dashboard-title text-3xl font-bold text-foreground md:text-4xl">今天看什么<span className="text-brand">.</span></h1><div className="dashboard-summary mt-3"><span className="summary-chip"><strong>{matches.length}</strong> 场重点赛事</span><span className="summary-chip"><strong>{liveMatches.length}</strong> 场正在进行</span></div><p className="mt-2 text-xs text-subtle">每30秒刷新 · 更新于 <time dateTime={updatedAt ?? undefined} suppressHydrationWarning>{formatMatchUpdateTime(updatedAt)}</time></p></div>
            {days.length > 0 && <div className="glass-control flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1.5" aria-label="比赛日期">{days.map((day, index) => { const key = dayKey(day); return <button key={key} aria-pressed={selectedDay === key} onClick={() => setSelectedDay(key)} className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${selectedDay === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{index === 0 ? "今天" : day.toLocaleDateString("zh-CN", { weekday: "short" })} <span className="ml-1 tabular-nums">{day.getDate()}</span></button>; })}</div>}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              {live ? <section className="match-spotlight overflow-hidden rounded-2xl border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3"><div className="flex min-w-0 items-center gap-2"><Badge className={`gap-1.5 border ${live.status === "live" ? "border-danger/20 bg-danger/10 text-danger" : "border-info/20 bg-info/10 text-info"}`}><span className={`size-1.5 rounded-full ${live.status === "live" ? "bg-danger" : "bg-info"}`} /> {live.status === "live" ? "LIVE" : live.status === "complete" ? "FINAL" : "NEXT"}</Badge><span className="text-sm font-semibold text-soft">{live.league}</span></div><time className="text-xs text-muted-foreground" dateTime={live.freshness} title={live.freshness} suppressHydrationWarning>更新于 {formatMatchUpdateTime(live.freshness)}</time></div>
                <div className="spotlight-teams grid items-center gap-5 px-5 py-9 md:grid-cols-[1fr_auto_1fr] md:px-7">
                  <div className="flex items-center justify-center gap-4 md:justify-end"><div className="text-right"><p className="text-lg font-bold text-foreground md:text-xl">{live.teamA}</p><p className="mt-1 text-xs text-muted-foreground">{live.gameName} · 战力样本待补充</p></div><TeamMark label={live.teamAShort} color={live.teamAColor} logo={live.teamALogo} name={live.teamA} /></div>
                  <div className="text-center"><p className="mb-2 text-xs text-muted-foreground">系列比分</p><div className="font-mono text-4xl font-black tracking-tight text-foreground"><span>{live.scoreA ?? "–"}</span><span className="mx-3 text-subtle">:</span><span>{live.scoreB ?? "–"}</span></div><p className="mt-2 text-xs font-semibold text-brand">{live.timeLabel}</p><p className="mt-1 text-xs text-subtle">{live.detail}</p></div>
                  <div className="flex items-center justify-center gap-4 md:justify-start"><TeamMark label={live.teamBShort} color={live.teamBColor} logo={live.teamBLogo} name={live.teamB} /><div><p className="text-lg font-bold text-foreground md:text-xl">{live.teamB}</p><p className="mt-1 text-xs text-muted-foreground">{live.stage}</p></div></div>
                </div>
                <GameScorePanel match={live} compact />
                <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border bg-surface-inset px-5 py-4">{live.streamUrl && <Button asChild className="bg-primary font-bold text-primary-foreground hover:bg-brand-hover"><a href={live.streamUrl} target="_blank" rel="noreferrer"><Radio /> 前往官方直播</a></Button>}<Button asChild variant="outline" className="border-border bg-surface-hover text-foreground hover:bg-surface-hover hover:text-foreground"><a href={`/matches/${live.id}`}><Swords /> 查看比赛详情</a></Button></div>
              </section> : <div className="rounded-2xl border border-border bg-card"><EmptyState label="当前筛选下暂无可展示的比赛。" /></div>}

              <section className="site-panel overflow-hidden rounded-2xl">
                <Tabs defaultValue="upcoming">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><TabsList variant="line" className="gap-5"><TabsTrigger value="upcoming" className="px-0 text-sm data-[state=active]:text-foreground">即将开始 <span className="text-subtle">{upcoming.length}</span></TabsTrigger><TabsTrigger value="live" className="px-0 text-sm data-[state=active]:text-foreground">直播中 <span className="text-danger">{liveMatches.length}</span></TabsTrigger><TabsTrigger value="following" className="px-0 text-sm data-[state=active]:text-foreground">我的关注</TabsTrigger></TabsList><Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:bg-surface-hover hover:text-foreground"><a href="/schedule">完整赛程 <ChevronRight /></a></Button></div>
                  <TabsContent value="upcoming" className="m-0">{upcoming.length ? upcoming.map((match) => <MatchRow key={match.id} match={match} />) : <EmptyState />}</TabsContent>
                  <TabsContent value="live" className="m-0">{liveMatches.length ? liveMatches.map((match) => <MatchRow key={match.id} match={match} />) : <EmptyState label="当前没有正在直播的比赛。" />}</TabsContent>
                  <TabsContent value="following" className="m-0">{followed.length ? followed.map((match) => <MatchRow key={match.id} match={match} />) : <EmptyState label={followsLoaded ? "尚未关注赛事或战队，可从详情页开始关注。" : "正在读取关注内容…"} />}</TabsContent>
                </Tabs>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="site-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">POWER INDEX</p><h2 className="mt-1 text-lg font-bold text-foreground">战力热榜</h2></div><Flame className="size-5 text-brand" /></div>
                <div className="rounded-xl border border-border bg-surface-inset p-4"><p className="text-sm font-semibold text-soft">正式榜单尚未发布</p><p className="mt-2 text-xs leading-5 text-subtle">有效系列赛和阵容数据达到门槛后才会显示分数。</p><a href="/rankings" className="mt-3 inline-flex text-xs font-semibold text-brand">查看计算规则 <ChevronRight className="size-4" /></a></div>
              </section>
              <section className="site-panel rounded-2xl p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">NEXT UP</p><h2 className="mt-1 text-lg font-bold text-foreground">本周焦点</h2></div><Clock3 className="size-5 text-subtle" /></div>
                <div className="mt-5 border-l border-border pl-4">{matches.filter((match) => match.status === "upcoming").slice(0, 3).map((match, index, rows) => <a href={`/matches/${match.id}`} key={match.id} className={`relative block pb-5 ${index === rows.length - 1 ? "pb-0" : ""}`}><span className="absolute -left-[21px] top-1 size-2 rounded-full border-2 border-card bg-subtle" /><p className="text-xs text-subtle">{new Date(match.startsAt).toLocaleString("zh-CN", { weekday: "short", hour: "2-digit", minute: "2-digit" })} · {match.league}</p><p className="mt-2 text-sm font-medium leading-5 text-soft"><MatchTeamNames match={match} short /></p></a>)}</div>
              </section>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EmptyState({ label = "当前筛选下没有即将开始的比赛。" }: { label?: string }) {
  return <div className="empty-state text-center text-sm"><span className="empty-state-icon"><CalendarDays className="size-5" aria-hidden="true" /></span><p>{label}</p></div>;
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
