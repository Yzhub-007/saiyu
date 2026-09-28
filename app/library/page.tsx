import { AlertTriangle, ArrowUpRight, BookOpen, Database } from "lucide-react";
import { externalDataSources } from "@/lib/external-data-sources";
import { getReferenceCatalog } from "@/lib/reference-data";
import type { ReferenceKind } from "@/lib/reference-data";
import { SiteShell } from "../_components/site-shell";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "地图、英雄与赛事数据入口｜赛域",
  description: "免费授权接口提供的游戏资料，以及经过标注的官方和第三方赛事数据入口。",
};

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const catalog = await getReferenceCatalog();
  const requestedTab = (await searchParams).tab;
  const initialTab: ReferenceKind = requestedTab === "lol-champion" || requestedTab === "dota-hero" ? requestedTab : "cs-map";
  return (
    <SiteShell active="资料库">
      <main className="mx-auto max-w-[1280px] px-4 py-7 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="size-6 text-brand" />
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-brand">REFERENCE LIBRARY</p>
              <h1 className="mt-1 text-3xl font-black text-foreground">地图、英雄与赛事资料</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-subtle">
            <Database className="size-4" />PandaScore 免费静态数据
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          资料图鉴来自免费接口，不代表某场比赛当前正在使用的地图或英雄。下方外部入口用于核对更详细的赛事资料。
        </p>

        <section className="mt-6" aria-labelledby="external-data-sources-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-brand">DATA SOURCES</p>
              <h2 id="external-data-sources-heading" className="mt-1 text-xl font-bold text-foreground">外部赛事数据入口</h2>
            </div>
            <p className="text-xs text-subtle">仅提供跳转，不自动抓取第三方网页数据</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {externalDataSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/45 hover:bg-surface-elevated"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-brand">{source.gameName}</p>
                    <h3 className="mt-1 font-bold text-foreground">{source.label}</h3>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-brand" />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{source.description}</p>
                <span className="mt-3 inline-flex rounded-full border border-border px-2 py-1 text-[11px] text-subtle">
                  {source.sourceType === "official" ? "官方来源" : "第三方资料"}
                </span>
              </a>
            ))}
          </div>
        </section>

        {catalog.warnings.length > 0 && (
          <div role="status" className="mt-5 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/[0.07] px-4 py-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{catalog.warnings.join("；")}，其余资料仍可正常浏览。</p>
          </div>
        )}
        <LibraryClient items={catalog.items} initialTab={initialTab} />
        <p className="mt-5 text-xs text-subtle">
          更新于 {new Date(catalog.fetchedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}（北京时间）
        </p>
      </main>
    </SiteShell>
  );
}
