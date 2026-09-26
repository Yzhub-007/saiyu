import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { SiteShell } from "../_components/site-shell";
import { PreferencesPanel } from "./preferences-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "账户与提醒｜赛域" };

export default async function AccountPage() {
  const user = await getChatGPTUser();
  return <SiteShell><main className="mx-auto max-w-[980px] px-4 py-8 md:px-6"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#9ab529]">ACCOUNT</p><h1 className="mt-2 text-3xl font-black text-white">账户与提醒</h1><p className="mt-2 text-sm text-zinc-500">关注赛事、同步日历，并控制开赛提醒。</p></div><div className="mt-6 grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]"><aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#101419] p-5">{user ? <><span className="grid size-12 place-items-center rounded-full bg-[#d8ff3e]/10 text-[#d8ff3e]"><UserRound /></span><p className="mt-4 font-bold text-white">{user.displayName}</p><p className="mt-1 break-all text-xs text-zinc-600">{user.email}</p><div className="mt-5 rounded-xl border border-white/[0.06] bg-black/10 p-3 text-xs leading-5 text-zinc-500"><LockKeyhole className="mb-2 size-4 text-[#8fa827]" />当前预览使用站点安全账户。公开版邮箱六位验证码接入位已预留，启用时需配置 Supabase 项目与生产 SMTP。</div><Button variant="outline" asChild className="mt-4 w-full border-white/10 bg-transparent text-zinc-400"><a href={chatGPTSignOutPath("/")} target="_top">退出登录</a></Button></> : <><span className="grid size-12 place-items-center rounded-full bg-white/[0.05] text-zinc-500"><Mail /></span><h2 className="mt-4 font-bold text-white">登录同步关注</h2><p className="mt-2 text-sm leading-6 text-zinc-600">登录后可跨设备保存关注、提醒与个人日历。</p><Button asChild className="mt-5 w-full bg-[#d8ff3e] font-bold text-[#10140d]"><a href={chatGPTSignInPath("/account")} target="_top">安全登录</a></Button></>}</aside><PreferencesPanel signedIn={Boolean(user)} /></div></main></SiteShell>;
}
