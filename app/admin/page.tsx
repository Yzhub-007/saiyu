import { AlertTriangle, CheckCircle2, DatabaseZap, Link2Off } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMatches } from "@/lib/matches-service";
import { requireChatGPTUser } from "../chatgpt-auth";
import { SiteShell } from "../_components/site-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "运营工作台｜赛域" };

type QueueItem = { id: string; item: string; detail: string; priority: "高" | "中"; state: string; href: string; icon: typeof AlertTriangle };

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const { data: matches, meta } = await listMatches();
  const now = Date.parse(meta.generatedAt);
  const active = matches.filter((match) => match.status !== "complete");
  const queues: QueueItem[] = [];
  for (const match of active) {
    const hours = (Date.parse(match.startsAt) - now) / 3_600_000;
    if (!match.streamUrl && hours <= 48) queues.push({ id: `${match.id}-stream`, item: `${match.teamA} vs ${match.teamB}`, detail: hours < 0 ? "比赛已开始，但尚无已验证的官方观赛入口" : `距离开赛约 ${Math.max(0, Math.round(hours))} 小时，尚无已验证的官方观赛入口`, priority: hours <= 6 ? "高" : "中", state: "待补充", href: `/matches/${match.id}`, icon: Link2Off });
    if (match.teamAId === "tbd-a" || match.teamBId === "tbd-b") queues.push({ id: `${match.id}-tbd`, item: match.league, detail: `对阵方尚未完全确认 · ${new Date(match.startsAt).toLocaleString("zh-CN")}`, priority: hours <= 24 ? "高" : "中", state: "观察中", href: `/matches/${match.id}`, icon: AlertTriangle });
  }
  if (meta.stale) queues.unshift({ id: "source-stale", item: "PandaScore 同步", detail: meta.warning || "上游暂不可用，当前页面使用最近一次缓存", priority: "高", state: "待复核", href: "/schedule", icon: DatabaseZap });
  const shown = queues.slice(0, 50);
  const verifiedStreams = active.filter((match) => Boolean(match.streamUrl)).length;

  return <SiteShell><main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#9ab529]">OPERATIONS</p><h1 className="mt-2 text-3xl font-black text-white">运营工作台</h1><p className="mt-2 text-sm text-zinc-500">登录身份：{user.displayName} · 队列来自当前正式赛程数据，不含演示条目</p></div><div className="mt-6 grid gap-4 sm:grid-cols-3">{[["待处理异常", String(queues.length), AlertTriangle, "#ff7180"], ["当前已载入", String(matches.length), DatabaseZap, "#52cfff"], ["已验证直播", String(verifiedStreams), CheckCircle2, "#d8ff3e"]].map(([label, value, Icon, color]) => { const I = Icon as typeof AlertTriangle; return <div key={label as string} className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><I className="size-5" style={{ color: color as string }} /><p className="mt-5 font-mono text-3xl font-black text-white">{value as string}</p><p className="mt-1 text-sm text-zinc-600">{label as string}</p></div>; })}</div><section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101419]"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-4"><h2 className="font-bold text-white">异常与复核队列</h2><p className="text-xs text-zinc-600">数据生成：{new Date(meta.generatedAt).toLocaleString("zh-CN")}</p></div>{shown.length ? <Table><TableHeader><TableRow className="border-white/[0.07] hover:bg-transparent"><TableHead>类型</TableHead><TableHead>项目</TableHead><TableHead>说明</TableHead><TableHead>优先级</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{shown.map((row) => <TableRow key={row.id} className="border-white/[0.07] hover:bg-white/[0.025]"><TableCell><row.icon className="size-4 text-zinc-500" /></TableCell><TableCell className="font-semibold text-zinc-300">{row.item}</TableCell><TableCell className="max-w-[420px] whitespace-normal text-zinc-500">{row.detail}</TableCell><TableCell><Badge className={row.priority === "高" ? "bg-[#ff6474]/10 text-[#ff7180]" : "bg-[#ffb24b]/10 text-[#ffc06e]"}>{row.priority}</Badge></TableCell><TableCell className="text-zinc-500">{row.state}</TableCell><TableCell className="text-right"><Button asChild size="sm" variant="outline" className="border-white/10 bg-transparent text-zinc-400"><a href={row.href}>查看</a></Button></TableCell></TableRow>)}</TableBody></Table> : <div className="grid min-h-44 place-items-center text-sm text-zinc-600">当前没有自动检测到的异常。</div>}</section></main></SiteShell>;
}
