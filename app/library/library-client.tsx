"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReferenceItem, ReferenceKind } from "@/lib/reference-data";
import { ReferenceImage } from "./reference-image";

const sections: Array<{ id: ReferenceKind; label: string; empty: string }> = [
  { id: "cs-map", label: "CS 地图", empty: "没有匹配的 CS 地图" },
  { id: "lol-champion", label: "LoL 英雄", empty: "没有匹配的 LoL 英雄" },
  { id: "dota-hero", label: "Dota 2 英雄", empty: "没有匹配的 Dota 2 英雄" },
];

type CatalogResponse = {
  data: ReferenceItem[];
  meta: { kind: ReferenceKind; fetchedAt: string; warnings: string[] };
};

const PAGE_SIZE = 48;

export function LibraryClient({ initialTab }: { initialTab: ReferenceKind }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ReferenceKind>(initialTab);
  const [catalogs, setCatalogs] = useState<Partial<Record<ReferenceKind, CatalogResponse>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (catalogs[activeTab]) {
      setLoading(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/v1/reference-catalog?kind=${encodeURIComponent(activeTab)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`资料接口返回 ${response.status}`);
        return response.json() as Promise<CatalogResponse>;
      })
      .then((catalog) => setCatalogs((current) => ({ ...current, [activeTab]: catalog })))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "资料暂时无法加载");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [activeTab, catalogs, retryKey]);

  const currentCatalog = catalogs[activeTab];
  const items = currentCatalog?.data ?? [];
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  const filtered = useMemo(() => normalized ? items.filter((item) => `${item.name} ${item.slug}`.toLocaleLowerCase("zh-CN").includes(normalized)) : items, [items, normalized]);
  const visible = filtered.slice(0, visibleCount);
  const currentSection = sections.find((section) => section.id === activeTab)!;

  return (
    <>
      <label className="relative mt-6 block">
        <span className="sr-only">搜索地图或英雄</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }}
          placeholder="搜索地图或英雄"
          className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-base text-foreground outline-none placeholder:text-subtle focus:border-brand/40"
        />
      </label>
      <Tabs
        value={activeTab}
        onValueChange={(value) => { setActiveTab(value as ReferenceKind); setQuery(""); setVisibleCount(PAGE_SIZE); }}
        className="mt-5"
      >
        <TabsList className="h-auto w-full justify-start overflow-x-auto bg-surface-inset p-1">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="shrink-0">
              {section.label}
              <span className="ml-1 text-xs text-subtle">{catalogs[section.id]?.data.length ?? "—"}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {loading && (
          <div role="status" className="grid min-h-48 place-items-center rounded-2xl border border-border bg-card text-sm text-subtle">
            <span className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" />正在加载当前分类…</span>
          </div>
        )}
        {!loading && error && (
          <div role="alert" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-warning/20 bg-warning/[0.07] p-5 text-sm text-warning">
            <AlertTriangle className="size-5" />
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="rounded-lg border border-warning/30 px-3 py-2 font-semibold hover:bg-warning/10">重新加载</button>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {visible.map((item) => (
                <article key={`${item.kind}-${item.id}`} className="overflow-hidden rounded-xl border border-border bg-card">
                  <ReferenceImage src={item.imageUrl} name={item.name} kind={item.kind} />
                  <div className="border-t border-border px-3 py-3">
                    <h2 className="truncate text-sm font-semibold text-foreground" title={item.name}>{item.name}</h2>
                    <p className="mt-1 truncate text-xs text-subtle">{item.slug}</p>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <div className="grid min-h-48 place-items-center rounded-2xl border border-border bg-card text-sm text-subtle">{currentSection.empty}</div>
            )}
            {visible.length < filtered.length && (
              <div className="mt-5 flex justify-center">
                <button type="button" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-hover">
                  显示更多（剩余 {filtered.length - visible.length}）
                </button>
              </div>
            )}
            {currentCatalog?.meta.warnings.length ? (
              <p className="mt-4 text-xs text-warning">{currentCatalog.meta.warnings.join("；")}</p>
            ) : currentCatalog ? (
              <p className="mt-4 text-xs text-subtle">更新于 {new Date(currentCatalog.meta.fetchedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}（北京时间）</p>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
