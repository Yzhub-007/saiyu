/* eslint-disable @next/next/no-html-link-for-pages -- vinext client navigation currently breaks with next/link */
import { Bell, CalendarDays, LayoutDashboard, Search, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/schedule", label: "赛程", icon: CalendarDays },
  { href: "/tournaments", label: "赛事", icon: Trophy },
  { href: "/teams", label: "战队", icon: Users },
];

export function SiteShell({ children, active }: { children: React.ReactNode; active?: string }) {
  return (
    <div className="min-h-screen bg-[#0b0e11] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b0e11]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1480px] items-center gap-3 px-4 md:px-6">
          <a href="/" className="mr-2 flex items-center gap-3" aria-label="赛域首页">
            <span className="grid size-9 place-items-center rounded-xl bg-[#d8ff3e] text-[#0b0e10]"><RadarMark /></span>
            <span className="hidden sm:block"><span className="block text-base font-black tracking-[0.18em] text-white">赛域</span><span className="block text-[9px] tracking-[0.14em] text-zinc-600">MATCH CONTROL</span></span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
            {links.map(({ href, label, icon: Icon }) => <Button key={href} variant="ghost" asChild className={active === label ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"}><a href={href}><Icon />{label}</a></Button>)}
            <Button variant="ghost" asChild className={active === "战力" ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"}><a href="/rankings">战力</a></Button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="hidden border-white/10 bg-transparent text-zinc-500 hover:bg-white/[0.05] hover:text-white lg:flex"><a href="/search"><Search /> 搜索赛事 / 战队</a></Button>
            <Button asChild variant="ghost" size="icon" aria-label="通知" className="text-zinc-500 hover:bg-white/[0.05] hover:text-white"><a href="/notifications"><Bell /></a></Button>
            <Button asChild className="bg-[#d8ff3e] font-bold text-[#10140d] hover:bg-[#c6ed2f]"><a href="/account">账户</a></Button>
          </div>
        </div>
        <nav className="flex overflow-x-auto border-t border-white/[0.06] px-3 md:hidden" aria-label="移动端主导航">
          {links.map(({ href, label }) => <a key={href} href={href} className={`shrink-0 px-3 py-2.5 text-sm ${active === label ? "border-b-2 border-[#d8ff3e] text-white" : "text-zinc-500"}`}>{label}</a>)}
          <a href="/rankings" className={`shrink-0 px-3 py-2.5 text-sm ${active === "战力" ? "border-b-2 border-[#d8ff3e] text-white" : "text-zinc-500"}`}>战力</a>
        </nav>
      </header>
      {children}
      <footer className="mt-12 border-t border-white/[0.07] px-4 py-7 text-center text-xs leading-6 text-zinc-600"><p>赛域 · 授权数据优先 · 直播仅跳转官方平台 · 战力指数不代表胜率</p><p className="mt-1"><a className="hover:text-zinc-300" href="/privacy">隐私政策</a><span className="mx-2">·</span><a className="hover:text-zinc-300" href="/terms">服务条款</a></p></footer>
    </div>
  );
}

export function TeamMark({ label, color, size = "md" }: { label: string; color: string; size?: "md" | "lg" }) {
  return <span className={`grid shrink-0 place-items-center rounded-2xl border border-white/10 font-black ${size === "lg" ? "size-16 text-base" : "size-11 text-xs"}`} style={{ background: `linear-gradient(145deg, ${color}35, #101418 76%)`, color }}>{label}</span>;
}

export function MetricBar({ label, value, color = "#d8ff3e" }: { label: string; value: number; color?: string }) {
  return <div><div className="mb-2 flex justify-between text-xs"><span className="text-zinc-500">{label}</span><span className="font-mono font-bold text-zinc-300">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} /></div></div>;
}

function RadarMark() {
  return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 4v8l5.6 5.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /></svg>;
}
