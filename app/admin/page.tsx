import { AlertTriangle, CheckCircle2, DatabaseZap, Link2Off } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireChatGPTUser } from "../chatgpt-auth";
import { SiteShell } from "../_components/site-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "运营工作台｜赛域" };

const queues = [
  { type: "数据冲突", icon: DatabaseZap, item: "VCT 冠军赛 · EDG vs PRX", detail: "官方源与聚合源开赛时间相差 5 分钟", priority: "高", state: "待复核" },
  { type: "缺少直播", icon: Link2Off, item: "PEL 秋季赛 · 第 4 周", detail: "距离开赛 3 小时，尚无中文官方地址", priority: "高", state: "待补充" },
  { type: "赛程确认", icon: AlertTriangle, item: "DreamLeague · 小组赛", detail: "对阵双方已确认，地图顺序待公布", priority: "中", state: "观察中" },
];

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  return <SiteShell><main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#9ab529]">OPERATIONS</p><h1 className="mt-2 text-3xl font-black text-white">运营工作台</h1><p className="mt-2 text-sm text-zinc-500">登录身份：{user.displayName} · 所有人工修正将记录来源与原因</p></div><Button className="bg-[#d8ff3e] font-bold text-[#10140d]">新建赛事内容</Button></div><div className="mt-6 grid gap-4 sm:grid-cols-3">{[["待处理异常", "3", AlertTriangle, "#ff7180"], ["今日自动更新", "286", DatabaseZap, "#52cfff"], ["已验证直播", "24", CheckCircle2, "#d8ff3e"]].map(([label, value, Icon, color]) => { const I = Icon as typeof AlertTriangle; return <div key={label as string} className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5"><I className="size-5" style={{ color: color as string }} /><p className="mt-5 font-mono text-3xl font-black text-white">{value as string}</p><p className="mt-1 text-sm text-zinc-600">{label as string}</p></div>; })}</div><section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101419]"><div className="border-b border-white/[0.07] px-5 py-4"><h2 className="font-bold text-white">异常与复核队列</h2></div><Table><TableHeader><TableRow className="border-white/[0.07] hover:bg-transparent"><TableHead>类型</TableHead><TableHead>项目</TableHead><TableHead>说明</TableHead><TableHead>优先级</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{queues.map((row) => <TableRow key={row.item} className="border-white/[0.07] hover:bg-white/[0.025]"><TableCell><row.icon className="size-4 text-zinc-500" /></TableCell><TableCell className="font-semibold text-zinc-300">{row.item}</TableCell><TableCell className="max-w-[360px] whitespace-normal text-zinc-500">{row.detail}</TableCell><TableCell><Badge className={row.priority === "高" ? "bg-[#ff6474]/10 text-[#ff7180]" : "bg-[#ffb24b]/10 text-[#ffc06e]"}>{row.priority}</Badge></TableCell><TableCell className="text-zinc-500">{row.state}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" className="border-white/10 bg-transparent text-zinc-400">处理</Button></TableCell></TableRow>)}</TableBody></Table></section></main></SiteShell>;
}
