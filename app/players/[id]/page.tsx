import { Activity, Crosshair, ShieldCheck } from "lucide-react";
import { SiteShell } from "../../_components/site-shell";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = id === "zmjjkk" ? "ZmjjKK" : id.charAt(0).toUpperCase() + id.slice(1);
  return <SiteShell active="战队"><main className="mx-auto max-w-[1100px] px-4 py-8 md:px-6"><section className="rounded-3xl border border-white/[0.08] bg-[#101419] p-7"><p className="text-xs font-semibold tracking-[0.14em] text-[#9ab529]">PLAYER PROFILE</p><h1 className="mt-3 text-4xl font-black text-white">{name}</h1><p className="mt-2 text-zinc-500">EDward Gaming · 无畏契约 · 决斗位</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[[Activity, "近期评分", "1.24"], [Crosshair, "场均首杀", "4.8"], [ShieldCheck, "数据样本", "18 张地图"]].map(([Icon, label, value]) => { const I = Icon as typeof Activity; return <div key={label as string} className="rounded-2xl border border-white/[0.07] bg-black/10 p-5"><I className="size-5 text-[#d8ff3e]" /><p className="mt-4 text-xs text-zinc-600">{label as string}</p><p className="mt-1 font-mono text-2xl font-black text-white">{value as string}</p></div>; })}</div><p className="mt-6 text-sm leading-6 text-zinc-600">选手深度数据仅在授权来源完整时展示。当前页面使用演示数据，正式接入后将补充地图、英雄或角色维度表现。</p></section></main></SiteShell>;
}
