import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Database, ShieldCheck, Swords } from "lucide-react";
import { findMatch } from "@/lib/matches-service";
import { getMatchDataLinks } from "@/lib/match-data-links";
import { SiteShell } from "../../_components/site-shell";
import { MatchLivePanel } from "../../_components/match-live-panel";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: match } = await findMatch(id);
  return match ? { title: `${match.teamA} vs ${match.teamB}｜赛域`, description: `${match.league} ${match.stage}，赛程、战力分析与官方观赛入口。` } : {};
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: match, meta } = await findMatch(id);
  if (!match) notFound();
  const dataLinks = getMatchDataLinks(match);
  const siteBase = (process.env.SITE_URL?.trim() || "https://saiyu-esports-hub.yuzhenjun233.chatgpt.site").replace(/\/$/, "");
  const structuredData = { "@context": "https://schema.org", "@type": "SportsEvent", name: `${match.teamA} vs ${match.teamB}`, startDate: match.startsAt, eventStatus: match.status === "complete" ? "https://schema.org/EventCompleted" : match.status === "live" ? "https://schema.org/EventInProgress" : "https://schema.org/EventScheduled", url: `${siteBase}/matches/${match.id}`, competitor: [{ "@type": "SportsTeam", name: match.teamA }, { "@type": "SportsTeam", name: match.teamB }], superEvent: { "@type": "SportsEvent", name: match.league } };

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <main className="mx-auto max-w-[1280px] px-4 py-7 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-subtle"><div className="flex min-w-0 flex-wrap items-center gap-2"><Link href="/schedule" className="hover:text-foreground">赛程</Link><span>/</span><Link href={`/tournaments/${match.tournamentId}`} className="hover:text-foreground">{match.league}</Link><span>/</span><span className="text-soft">{match.teamAShort} vs {match.teamBShort}</span></div><div className="flex items-center gap-2" title={match.freshness}><Database className="size-3.5" />授权数据同步</div></div>

        <MatchLivePanel key={match.id} initialMatch={match} source={meta.source} stale={meta.stale} />

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.15em] text-brand">EXPLAINABLE POWER</p><h2 className="mt-1 text-xl font-bold text-foreground">战力拆解</h2></div><Swords className="size-5 text-subtle" /></div>
            <div className="mt-6 rounded-xl border border-border bg-surface-inset p-6 text-sm leading-6 text-muted-foreground">{match.status === "complete" ? "本站已保存本场基础历史比分。当前套餐尚未提供地图、回合、选手表现和阵容维度，因此不生成深度战力总分。" : "当前授权数据尚不足以稳定计算最近 10 个系列赛及阵容维度，因此不展示总分或拆解指标。待样本满足门槛并通过公式回测后开放。"}</div>
            <div className="mt-6 rounded-xl border border-brand/15 bg-primary/[0.035] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="size-4 text-brand" />如何理解这组数据</div><p className="mt-2 text-sm leading-6 text-muted-foreground">指数综合最近 10 个系列赛、对手强度、地图表现、阵容稳定度与赛程强度。它只反映近期竞技状态，不是胜率预测，也不构成任何投注建议。</p></div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-semibold tracking-[0.14em] text-subtle">OFFICIAL WATCH</p><h2 className="mt-1 text-lg font-bold text-foreground">官方观赛</h2><div className="mt-4 rounded-xl border border-border bg-surface-inset p-4"><p className="font-semibold text-foreground">{match.streamPlatform}</p><p className="mt-1 text-xs text-subtle">{match.language}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">直播由赛事官方平台提供；区域限制和解说语言以官方页面为准。</p></div></section>
            <section className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-semibold tracking-[0.14em] text-subtle">DATA SOURCES</p><h2 className="mt-1 text-lg font-bold text-foreground">数据来源与进阶统计</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">基础赛果由本站持续归档。需要地图、回合、选手数据或深度战力分析时，可前往以下官方或授权来源。</p><div className="mt-4 space-y-2">{dataLinks.map((link) => <a key={`${link.kind}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-inset p-3 transition hover:border-border-strong hover:bg-surface-hover"><span><span className="block text-sm font-semibold text-soft">{link.label}</span><span className="mt-1 block text-xs leading-5 text-subtle">{link.description}</span></span><ArrowUpRight className="mt-0.5 size-4 shrink-0 text-subtle transition group-hover:text-brand" /></a>)}</div></section>
            <section className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-semibold tracking-[0.14em] text-subtle">MATCH INFO</p><div className="mt-4 space-y-4">{[["赛制", match.bestOf], ["阶段", match.stage], ["开赛", new Date(match.startsAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) + "（北京时间）"], ["数据来源", meta.source === "demo" ? "演示数据" : "PandaScore"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><span className="text-subtle">{label}</span><span className="text-right text-soft">{value}</span></div>)}</div></section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
