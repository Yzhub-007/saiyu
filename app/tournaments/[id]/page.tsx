import { MatchTeamNames } from "../../_components/match-team-names";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BookOpen, CalendarDays, ChevronRight, Database, Link2, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { findTournament } from "@/lib/matches-service";
import { FollowButton } from "../../_components/follow-button";
import { SiteShell, TeamMark } from "../../_components/site-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await findTournament(id);
  return tournament ? { title: `${tournament.name}｜赛域`, description: `${tournament.name} 的授权赛程、参赛队伍与官方观赛入口。` } : {};
}

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await findTournament(id);
  if (!tournament) notFound();
  const live = tournament.matches.filter((match) => match.status === "live").length;
  const upcoming = tournament.matches.filter((match) => match.status === "upcoming").length;
  const starts = tournament.matches.map((match) => Date.parse(match.startsAt)).filter(Number.isFinite);
  const range = starts.length ? `${new Date(Math.min(...starts)).toLocaleDateString("zh-CN")} — ${new Date(Math.max(...starts)).toLocaleDateString("zh-CN")}` : "待确认";

  return (
    <SiteShell active="赛事">
      <main className="mx-auto max-w-[1320px] px-4 py-7 md:px-6">
        <section className="rounded-3xl border border-border match-spotlight p-6 md:p-9">
          <Badge className="border border-info/20 bg-info/10 text-info">
            {live ? `${live} 场进行中` : upcoming ? `${upcoming} 场待赛` : "已结束"}
          </Badge>
          <h1 className="mt-4 text-3xl font-black text-foreground md:text-5xl">{tournament.name}</h1>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CalendarDays className="size-4" />{range}</span>
            <span className="flex items-center gap-2"><Users className="size-4" />{tournament.teams.length} 支已确认队伍</span>
            <span className="flex items-center gap-2"><Database className="size-4" />{tournament.gameName}</span>
          </div>
          <div className="mt-6"><FollowButton entityType="tournament" entityId={tournament.id} label="关注赛事" /></div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-2"><Trophy className="size-5 text-info" /><h2 className="text-xl font-bold text-foreground">赛事赛程</h2></div>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              {tournament.matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`} className="detail-match-row items-center gap-3 border-b border-border px-4 py-4 hover:bg-surface-hover">
                  <div>
                    <p className="text-sm font-bold text-foreground">{match.status === "live" ? "进行中" : new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-xs text-subtle">{match.bestOf}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-soft"><MatchTeamNames match={match} /></p>
                    <p className="mt-1 text-xs text-subtle">{match.stage}</p>
                  </div>
                  <ChevronRight className="size-4 text-subtle" />
                </Link>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            {tournament.dataSources.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Link2 className="size-5 text-brand" />
                  <h2 className="text-lg font-bold text-foreground">赛事数据源</h2>
                </div>
                <p className="mt-2 text-xs leading-5 text-subtle">已按项目关联，用于核对本赛事的详细资料。</p>
                <div className="mt-4 space-y-2">
                  {tournament.dataSources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-xl border border-border bg-surface-inset p-3 hover:bg-surface-hover"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-soft">{source.label}</p>
                          <p className="mt-1 text-xs text-subtle">{source.sourceType === "official" ? "官方来源" : "第三方资料"}</p>
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-subtle group-hover:text-brand" />
                      </div>
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-subtle">未取得结构化接口授权前仅提供关联入口，不抓取网页内容。</p>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-foreground">已确认队伍</h2>
              <div className="mt-4 space-y-2">
                {tournament.teams.map((team) => (
                  <Link href={`/teams/${team.id}`} key={team.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-inset p-3 hover:bg-surface-hover">
                    <TeamMark label={team.short} color={team.color} logo={team.logo} name={team.name} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-soft">{team.name}</span>
                    <ChevronRight className="size-4 text-subtle" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-brand/15 bg-primary/[0.03] p-5">
              <BookOpen className="size-5 text-brand" />
              <h2 className="mt-3 font-bold text-foreground">观赛手册状态</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">当前仅发布授权来源能够确认的项目、赛程、阶段与直播入口。积分榜、奖金和晋级规则将在官方来源确认后补充。</p>
            </section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
