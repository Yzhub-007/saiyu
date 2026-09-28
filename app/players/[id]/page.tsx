import { Database, ShieldCheck } from "lucide-react";
import { SiteShell } from "../../_components/site-shell";

export const metadata = { title: "选手资料｜赛域" };

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SiteShell active="战队"><main className="mx-auto max-w-[860px] px-4 py-10 md:px-6"><section className="rounded-3xl border border-border bg-card p-7 md:p-10"><Database className="size-8 text-brand" /><p className="mt-6 text-xs font-semibold tracking-[0.14em] text-brand">PLAYER DATA</p><h1 className="mt-2 break-all text-3xl font-black text-foreground">{decodeURIComponent(id)}</h1><div className="mt-6 flex gap-3 rounded-xl border border-border bg-surface-inset p-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" /><div><h2 className="font-bold text-foreground">暂无可公开的授权深度数据</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">选手评分、首杀、地图和英雄数据在来源完整且授权允许后才会展示。目前不会使用演示数值补齐。</p></div></div></section></main></SiteShell>;
}
