import { AlertTriangle, BookOpen, Database } from "lucide-react";
import { getReferenceCatalog } from "@/lib/reference-data";
import type { ReferenceKind } from "@/lib/reference-data";
import { SiteShell } from "../_components/site-shell";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "地图与英雄资料库｜赛域", description: "免费授权接口提供的 CS 地图、英雄联盟英雄与 Dota 2 英雄资料。" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const catalog = await getReferenceCatalog();
  const requestedTab = (await searchParams).tab;
  const initialTab: ReferenceKind = requestedTab === "lol-champion" || requestedTab === "dota-hero" ? requestedTab : "cs-map";
  return <SiteShell active="资料库"><main className="mx-auto max-w-[1280px] px-4 py-7 md:px-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><BookOpen className="size-6 text-brand" /><div><p className="text-xs font-semibold tracking-[0.16em] text-brand">REFERENCE LIBRARY</p><h1 className="mt-1 text-3xl font-black text-foreground">地图与英雄资料库</h1></div></div><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-subtle"><Database className="size-4" />PandaScore 免费静态数据</div></div><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">这里展示免费接口可以确认的地图和英雄资料。它是资料图鉴，不代表某场比赛当前正在使用的地图或英雄。</p>{catalog.warnings.length > 0 && <div role="status" className="mt-5 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/[0.07] px-4 py-3 text-sm text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>{catalog.warnings.join("；")}，其余资料仍可正常浏览。</p></div>}<LibraryClient items={catalog.items} initialTab={initialTab} /><p className="mt-5 text-xs text-subtle">更新于 {new Date(catalog.fetchedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}（北京时间）</p></main></SiteShell>;
}
