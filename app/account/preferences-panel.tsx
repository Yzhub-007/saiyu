"use client";

import { useState } from "react";
import { CalendarPlus, Check, Loader2, Mail, MonitorDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Preferences = { inAppEnabled: boolean; emailEnabled: boolean; reminder24h: boolean; reminder15m: boolean; timezone: string };

export function PreferencesPanel({ signedIn }: { signedIn: boolean }) {
  const [prefs, setPrefs] = useState<Preferences>({ inAppEnabled: true, emailEnabled: true, reminder24h: true, reminder15m: true, timezone: "Asia/Shanghai" });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const update = (key: keyof Preferences, value: boolean | string) => setPrefs((current) => ({ ...current, [key]: value }));
  async function save() {
    setState("saving");
    try {
      const response = await fetch("/api/v1/notification-preferences", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(prefs) });
      if (!response.ok) throw new Error();
      setState("saved");
      setTimeout(() => setState("idle"), 1800);
    } catch { setState("error"); }
  }
  return <div className="space-y-5"><section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6"><div className="flex items-center gap-3"><MonitorDot className="size-5 text-[#d8ff3e]" /><div><h2 className="font-bold text-white">提醒渠道</h2><p className="mt-1 text-xs text-zinc-600">控制赛前和赛程变更提醒</p></div></div><div className="mt-6 divide-y divide-white/[0.06]">{[["inAppEnabled", "站内提醒", "在赛域通知中心接收消息", MonitorDot], ["emailEnabled", "邮件提醒", "发送至账户绑定邮箱", Mail]].map(([key, title, copy, Icon]) => { const I = Icon as typeof Mail; return <div key={key as string} className="flex items-center justify-between gap-4 py-4"><div className="flex items-center gap-3"><I className="size-4 text-zinc-600" /><div><p className="text-sm font-semibold text-zinc-200">{title as string}</p><p className="mt-1 text-xs text-zinc-600">{copy as string}</p></div></div><Switch checked={prefs[key as keyof Preferences] as boolean} onCheckedChange={(value) => update(key as keyof Preferences, value)} aria-label={title as string} /></div>; })}</div></section><section className="rounded-2xl border border-white/[0.08] bg-[#101419] p-5 md:p-6"><div className="flex items-center gap-3"><CalendarPlus className="size-5 text-[#d8ff3e]" /><div><h2 className="font-bold text-white">提醒时间</h2><p className="mt-1 text-xs text-zinc-600">同一场比赛每个节点只发送一次</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{[["reminder24h", "提前 24 小时"], ["reminder15m", "提前 15 分钟"]].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/10 p-4 text-sm font-semibold text-zinc-300"><span>{label}</span><Switch checked={prefs[key as keyof Preferences] as boolean} onCheckedChange={(value) => update(key as keyof Preferences, value)} /></label>)}</div><div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-300"><a href="/calendar/demo.ics"><CalendarPlus />订阅 ICS 日历</a></Button><Button onClick={save} disabled={!signedIn || state === "saving"} className="bg-[#d8ff3e] font-bold text-[#10140d] hover:bg-[#c6ed2f]">{state === "saving" ? <Loader2 className="animate-spin" /> : state === "saved" ? <Check /> : null}{state === "saved" ? "已保存" : "保存设置"}</Button></div>{state === "error" && <p className="mt-3 text-xs text-[#ff7180]">暂时无法保存，请稍后重试。</p>}{!signedIn && <p className="mt-3 text-xs text-zinc-600">登录后可将设置同步到不同设备。</p>}</section></div>;
}
