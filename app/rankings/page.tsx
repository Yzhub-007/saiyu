import { Info, ShieldCheck } from "lucide-react";
import { SiteShell } from "../_components/site-shell";

export const metadata = { title: "战力分析｜赛域" };

export default function RankingsPage() {
  return <SiteShell active="战力"><main className="mx-auto max-w-[980px] px-4 py-10 md:px-6"><section className="rounded-3xl border border-white/[0.08] bg-[#101419] p-7 md:p-10"><ShieldCheck className="size-8 text-[#d8ff3e]" /><p className="mt-6 text-xs font-semibold tracking-[0.16em] text-[#9ab529]">POWER INDEX</p><h1 className="mt-2 text-3xl font-black text-white">正式战力榜正在积累样本</h1><p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">现阶段已接入的赛程与赛果不足以稳定计算所有项目的地图表现、阵容稳定度和对手修正 Elo。为避免把演示值误认为真实分析，暂不发布排行榜。</p><div className="mt-8 grid gap-3 sm:grid-cols-5">{[["近期表现","35%"],["对手强度","25%"],["地图 / 模式","20%"],["阵容稳定","10%"],["赛程强度","10%"]].map(([label,value]) => <div key={label} className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><p className="font-mono text-xl font-black text-white">{value}</p><p className="mt-1 text-xs text-zinc-600">{label}</p></div>)}</div><div className="mt-6 flex gap-3 rounded-xl border border-[#d8ff3e]/15 bg-[#d8ff3e]/[0.035] p-4 text-sm leading-6 text-zinc-500"><Info className="mt-0.5 size-5 shrink-0 text-[#d8ff3e]" /><p>单支队伍至少需要 5 个有效系列赛；数据超过 60 天未更新时隐藏总分。不同游戏之间不进行横向比较。</p></div></section></main></SiteShell>;
}
