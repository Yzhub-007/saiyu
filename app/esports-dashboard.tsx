"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Keep the established full-document navigation for Vinext compatibility. */

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarDays, ChevronRight, Clock3, Radio, ShieldCheck, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Match } from "@/lib/esports-data";
import { WebMcpTools } from "./webmcp-tools";
import { SiteHeader } from "./_components/site-shell";
import { LiquidGlass } from "./_components/liquid-glass";
import { TeamMark } from "./_components/team-mark";
import { MatchTeamNames } from "./_components/match-team-names";
import { FixtureRow, MatchStatus } from "./_components/fixture-row";
import { GameScorePanel } from "./_components/game-score-panel";
import { useMatchUpdates } from "./_components/use-match-updates";
import { MatchSyncStatus } from "./_components/match-sync-status";

const games = [
  { id: "all", short: "ALL", name: "全部项目", tone: "bg-[#d8ff3e] text-[#10150d]" },
  { id: "lol", short: "LOL", name: "英雄联盟", tone: "bg-[#18243a] text-[#8cc8ff]" },
  { id: "val", short: "VAL", name: "无畏契约", tone: "bg-[#33181d] text-[#ff6474]" },
  { id: "cs2", short: "CS", name: "CS2", tone: "bg-[#2d2215] text-[#ffb24b]" },
  { id: "dota", short: "D2", name: "Dota 2", tone: "bg-[#301719] text-[#ff8779]" },
  { id: "kog", short: "KOG", name: "王者荣耀", tone: "bg-[#22203b] text-[#b9a8ff]" },
  { id: "pel", short: "PEL", name: "和平精英", tone: "bg-[#19352f] text-[#71e7be]" },
  { id: "pubg", short: "PUBG", name: "PUBG", tone: "bg-[#332c16] text-[#ffe06f]" },
  { id: "mlbb", short: "ML", name: "MLBB", tone: "bg-[#152c3b] text-[#67ccff]" },
];

export function EsportsDashboard({ initialMatches, dataSource, stale: initialStale, generatedAt }: { initialMatches: Match[]; dataSource: "pandascore" | "demo"; stale: boolean; generatedAt: string }) {
  const updates = useMatchUpdates(initialMatches, { source: dataSource, stale: initialStale, generatedAt });
  const { matches, stale } = updates;
  const [game, setGame] = useState("all");
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialMatches.some((match) => match.status === "live") ? "live" : "upcoming");
  const [follows, setFollows] = useState<Array<{ entityType: string; entityId: string }>>([]);
  const [followsLoaded, setFollowsLoaded] = useState(false);
  const filtered = useMemo(() => matches.filter((match) => game === "all" || match.game === game), [game, matches]);
  const liveMatches = filtered.filter((match) => match.status === "live");
  const nextMatches = filtered.filter((match) => match.status === "upcoming").sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const upcoming = nextMatches.filter((match) => !selectedDay || dayKey(new Date(match.startsAt)) === selectedDay);
  const completed = filtered.filter((match) => match.status === "complete").sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  const focus = liveMatches[0] ?? nextMatches[0] ?? completed[0];
  const followed = filtered.filter((match) => follows.some((item) => (item.entityType === "team" && (item.entityId === match.teamAId || item.entityId === match.teamBId)) || (item.entityType === "tournament" && item.entityId === match.tournamentId) || (item.entityType === "game" && item.entityId === match.game)));
  const days = today ? Array.from({ length: 4 }, (_, index) => { const value = new Date(today); value.setHours(0, 0, 0, 0); value.setDate(value.getDate() + index); return value; }) : [];
  const selectedGame = games.find((item) => item.id === game)?.name ?? "全部项目";

  useEffect(() => {
    const timer = window.setTimeout(() => { const value = new Date(); setToday(value); setSelectedDay(dayKey(value)); }, 0);
    const controller = new AbortController();
    fetch("/api/v1/follows", { signal: controller.signal }).then(async (response) => response.ok ? response.json() as Promise<{ data?: Array<{ entityType: string; entityId: string }> }> : null).then((body) => { if (!controller.signal.aborted) { if (body?.data) setFollows(body.data); setFollowsLoaded(true); } }).catch(() => { if (!controller.signal.aborted) setFollowsLoaded(true); });
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, []);

  return (
    <SidebarProvider defaultOpen>
      <WebMcpTools onFilter={setGame} />
      <Sidebar collapsible="icon" variant="floating" className="dashboard-sidebar">
        <LiquidGlass className="sidebar-glass" contentClassName="sidebar-glass-content" weight="thick">
        <SidebarHeader className="h-[72px] justify-center border-b border-border px-3">
          <a href="/" className="flex items-center gap-3 overflow-hidden px-1" aria-label="赛域首页">
            <span className="brand-mark grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><RadarMark /></span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="block text-base font-black tracking-[0.18em]">赛域</span><span className="block text-xs tracking-[0.12em] text-muted-foreground">ESPORTS HUB</span></span>
          </a>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          <SidebarGroup><SidebarGroupLabel className="mb-2 text-subtle">比赛项目</SidebarGroupLabel><SidebarGroupContent><SidebarMenu className="gap-1">
            {games.map((item) => <SidebarMenuItem key={item.id}><SidebarMenuButton isActive={game === item.id} aria-pressed={game === item.id} tooltip={item.name} onClick={() => setGame(item.id)} className="h-11 rounded-xl text-soft hover:bg-surface-hover hover:text-foreground"><span className={`game-mark grid size-7 shrink-0 place-items-center rounded-lg font-black ${item.tone}`}>{item.short}</span><span className="font-medium">{item.name}</span>{item.id !== "all" && matches.some((match) => match.game === item.id && match.status === "live") && <span className="ml-auto size-1.5 rounded-full bg-danger group-data-[collapsible=icon]:hidden" aria-label="有比赛进行中" />}</SidebarMenuButton></SidebarMenuItem>)}
          </SidebarMenu></SidebarGroupContent></SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-border p-3"><a href="/account" className="flex items-center gap-3 rounded-xl p-2 text-muted-foreground hover:bg-surface-hover"><Users className="size-5 shrink-0" /><span className="text-sm group-data-[collapsible=icon]:hidden">管理我的关注</span><ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden" /></a></SidebarFooter>
        </LiquidGlass>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="dashboard-content min-w-0 text-foreground">
        <SiteHeader active="总览" sidebarTrigger={<SidebarTrigger aria-label="切换项目侧栏" className="text-soft" />} />
        <div id="main-content" tabIndex={-1} className="dashboard-main mx-auto w-full max-w-[1440px] px-4 py-6 md:px-7 lg:py-8">
          {stale && <div role="status" className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${matches.length ? "border-warning/20 bg-warning/[0.07] text-warning" : "border-danger/20 bg-danger/[0.07] text-danger"}`}><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>{matches.length ? "数据同步暂时中断，当前展示上次成功更新的赛程与比分。" : "赛事数据源暂时不可用，请稍后刷新。"}</p></div>}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><p className="mb-2 text-xs font-semibold tracking-[0.14em] text-brand">THE MATCHDAY</p><h1 className="dashboard-title text-3xl font-bold md:text-4xl">赛事总览<span className="text-brand">.</span></h1><p className="mt-3 text-sm text-muted-foreground">{selectedGame} <span className="mx-2 text-subtle">/</span><strong className="font-semibold text-foreground">{liveMatches.length}</strong> 场进行中 <span className="mx-2 text-subtle">·</span>{nextMatches.length} 场待开赛</p></div>
            <MatchSyncStatus source={dataSource} {...updates} />
          </div>

          <div className="dashboard-grid grid items-start gap-6">
            <div className="min-w-0 space-y-6">
              {focus && <section className="match-spotlight overflow-hidden rounded-2xl" aria-label={focus.status === "live" ? "正在进行的比赛" : focus.status === "upcoming" ? "下一场比赛" : "最近赛果"}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5"><div className="flex min-w-0 flex-wrap items-center gap-3"><MatchStatus status={focus.status} /><span className="text-sm font-semibold text-soft">{focus.league}</span></div><span className="text-xs text-muted-foreground">{focus.gameName} · {focus.bestOf}</span></div>
                <div className="spotlight-matchup">
                  <div className="spotlight-team"><TeamMark label={focus.teamAShort} color={focus.teamAColor} logo={focus.teamALogo} name={focus.teamA} size="lg" /><p>{focus.teamA}</p></div>
                  <div className="spotlight-score"><span className="text-xs text-muted-foreground">{focus.status === "upcoming" ? "即将开赛" : "系列比分"}</span><strong>{focus.status === "upcoming" ? <span className="spotlight-vs">VS</span> : <>{focus.scoreA ?? "–"}<span className="score-divider">:</span>{focus.scoreB ?? "–"}</>}</strong><time dateTime={focus.startsAt} suppressHydrationWarning className="text-xs font-medium text-muted-foreground">{new Date(focus.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div>
                  <div className="spotlight-team"><TeamMark label={focus.teamBShort} color={focus.teamBColor} logo={focus.teamBLogo} name={focus.teamB} size="lg" /><p>{focus.teamB}</p></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5"><p className="text-xs text-muted-foreground">{focus.stage}</p><div className="flex flex-wrap gap-2">{focus.streamUrl && <Button asChild className="font-semibold"><a href={focus.streamUrl} target="_blank" rel="noreferrer"><Radio />官方直播<ArrowUpRight /></a></Button>}<Button asChild variant="outline" className="border-border bg-card"><a href={`/matches/${focus.id}`}>比赛详情<ChevronRight /></a></Button></div></div>
                <GameScorePanel match={focus} compact />
              </section>}

              <section className="match-list-section" aria-label="比赛列表">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <LiquidGlass className="match-list-controls"><div className="match-list-header"><TabsList variant="line" className="h-12 w-full justify-start gap-5 overflow-x-auto rounded-none"><TabsTrigger value="live" className="shrink-0 px-0">进行中<span className={liveMatches.length ? "text-danger" : "text-subtle"}>{liveMatches.length}</span></TabsTrigger><TabsTrigger value="upcoming" className="shrink-0 px-0">赛程<span className="text-subtle">{upcoming.length}</span></TabsTrigger><TabsTrigger value="results" className="shrink-0 px-0">赛果</TabsTrigger><TabsTrigger value="following" className="shrink-0 px-0">我的关注</TabsTrigger></TabsList></div></LiquidGlass>
                  <TabsContent value="upcoming" className="m-0">
                    <div className="date-strip" aria-label="比赛日期"><button onClick={() => setSelectedDay(null)} aria-pressed={selectedDay === null}>全部日期</button>{days.map((day, index) => <button key={dayKey(day)} aria-pressed={selectedDay === dayKey(day)} onClick={() => setSelectedDay(dayKey(day))}>{index === 0 ? "今天" : index === 1 ? "明天" : day.toLocaleDateString("zh-CN", { weekday: "short" })}<span>{day.getMonth() + 1}/{day.getDate()}</span></button>)}</div>
                    {upcoming.length ? upcoming.slice(0, 12).map((match) => <FixtureRow key={match.id} match={match} />) : <EmptyState label="这一天还没有已确认的比赛" action={<button onClick={() => setSelectedDay(null)} className="text-sm font-semibold text-brand">查看其他日期 <ChevronRight className="inline size-4" /></button>} />}
                  </TabsContent>
                  <TabsContent value="live" className="m-0">{liveMatches.length ? liveMatches.map((match) => <FixtureRow key={match.id} match={match} />) : <EmptyState label="当前项目暂无进行中的比赛" action={<button onClick={() => { setActiveTab("upcoming"); setSelectedDay(null); }} className="text-sm font-semibold text-brand">查看接下来的比赛 <ChevronRight className="inline size-4" /></button>} />}</TabsContent>
                  <TabsContent value="results" className="m-0">{completed.length ? completed.slice(0, 12).map((match) => <FixtureRow key={match.id} match={match} />) : <EmptyState label="当前项目还没有已归档的赛果" />}</TabsContent>
                  <TabsContent value="following" className="m-0">{followed.length ? followed.map((match) => <FixtureRow key={match.id} match={match} />) : <EmptyState label={followsLoaded ? "关注战队，让比赛更容易找到" : "正在读取关注内容…"} action={followsLoaded && <a href="/teams" className="text-sm font-semibold text-brand">浏览战队 <ChevronRight className="inline size-4" /></a>} />}</TabsContent>
                  <a href="/schedule" className="match-list-footer">{activeTab === "results" ? "在赛程中心查看全部赛果" : "前往完整赛程"}<ChevronRight className="size-4" /></a>
                </Tabs>
              </section>
            </div>

            <aside className="min-w-0 space-y-5">
              <section className="site-panel overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-base font-bold">接下来</h2><Clock3 className="size-4 text-subtle" /></div><div className="px-5">{nextMatches.slice(0, 4).map((match) => <a href={`/matches/${match.id}`} key={match.id} className="next-match block border-b border-border py-4 last:border-0"><div className="mb-2 flex items-center justify-between gap-2"><time dateTime={match.startsAt} suppressHydrationWarning className="text-xs font-semibold text-soft">{new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time><span className="text-xs text-subtle">{match.bestOf}</span></div><MatchTeamNames match={match} short /><p className="mt-2 truncate text-xs text-subtle">{match.league}</p></a>)}{!nextMatches.length && <p className="py-6 text-sm text-muted-foreground">新赛程确认后会显示在这里。</p>}</div></section>
              <section className="rounded-2xl border border-border p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-brand" />数据与观赛</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{dataSource === "pandascore" ? "赛程与系列比分来自 PandaScore，时间按你的本地时区显示。" : "当前为演示数据，比赛信息仅用于界面预览。"}</p><p className="mt-2 text-xs leading-5 text-subtle">单局状态与实时小比分分别标注；缺失数据不作推算。直播链接跳转官方平台。</p></section>
              <a href="/rankings" className="flex items-center gap-3 px-1 py-2 text-sm text-muted-foreground hover:text-foreground"><Trophy className="size-4" /><span>了解战力指数</span><ChevronRight className="ml-auto size-4" /></a>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EmptyState({ label, action }: { label: string; action?: React.ReactNode }) {
  return <div className="empty-state text-center text-sm"><span className="empty-state-icon"><CalendarDays className="size-5" aria-hidden="true" /></span><p>{label}</p>{action}</div>;
}
function dayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function RadarMark() { return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 4v8l5.6 5.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /></svg>; }
