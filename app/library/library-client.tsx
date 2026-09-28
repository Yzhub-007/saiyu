"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReferenceItem, ReferenceKind } from "@/lib/reference-data";
import { ReferenceImage } from "./reference-image";

const sections: Array<{ id: ReferenceKind; label: string; empty: string }> = [
  { id: "cs-map", label: "CS 地图", empty: "没有匹配的 CS 地图" },
  { id: "lol-champion", label: "LoL 英雄", empty: "没有匹配的 LoL 英雄" },
  { id: "dota-hero", label: "Dota 2 英雄", empty: "没有匹配的 Dota 2 英雄" },
];

export function LibraryClient({ items, initialTab }: { items: ReferenceItem[]; initialTab: ReferenceKind }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  const filtered = useMemo(() => normalized ? items.filter((item) => `${item.name} ${item.slug}`.toLocaleLowerCase("zh-CN").includes(normalized)) : items, [items, normalized]);

  return <>
    <label className="relative mt-6 block"><span className="sr-only">搜索地图或英雄</span><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索地图或英雄" className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-base text-foreground outline-none placeholder:text-subtle focus:border-brand/40" /></label>
    <Tabs defaultValue={initialTab} className="mt-5"><TabsList className="h-auto w-full justify-start overflow-x-auto bg-surface-inset p-1">{sections.map((section) => <TabsTrigger key={section.id} value={section.id} className="shrink-0">{section.label}<span className="ml-1 text-xs text-subtle">{filtered.filter((item) => item.kind === section.id).length}</span></TabsTrigger>)}</TabsList>{sections.map((section) => { const rows = filtered.filter((item) => item.kind === section.id); return <TabsContent key={section.id} value={section.id} className="mt-4"><div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{rows.map((item) => <article key={`${item.kind}-${item.id}`} className="overflow-hidden rounded-xl border border-border bg-card"><ReferenceImage src={item.imageUrl} name={item.name} kind={item.kind} /><div className="border-t border-border px-3 py-3"><h2 className="truncate text-sm font-semibold text-foreground" title={item.name}>{item.name}</h2><p className="mt-1 truncate text-xs text-subtle">{item.slug}</p></div></article>)}</div>{!rows.length && <div className="grid min-h-48 place-items-center rounded-2xl border border-border bg-card text-sm text-subtle">{section.empty}</div>}</TabsContent>; })}</Tabs>
  </>;
}
