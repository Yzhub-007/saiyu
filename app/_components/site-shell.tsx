/* eslint-disable @next/next/no-html-link-for-pages -- vinext client navigation currently breaks with next/link */
import { Bell, BookOpen, CalendarDays, LayoutDashboard, Search, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export { TeamMark } from "./team-mark";

const links = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/schedule", label: "赛程", icon: CalendarDays },
  { href: "/tournaments", label: "赛事", icon: Trophy },
  { href: "/teams", label: "战队", icon: Users },
  { href: "/library", label: "资料库", icon: BookOpen },
];

export function SiteHeader({ active, sidebarTrigger }: { active?: string; sidebarTrigger?: React.ReactNode }) {
  return <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="site-header glass-toolbar sticky top-0 z-40 border-b">
        <div className="site-header-inner mx-auto flex h-[72px] max-w-[1480px] items-center gap-3 px-4 md:px-6">
          {sidebarTrigger}
          <a href="/" className={`mr-2 flex shrink-0 items-center gap-3 ${sidebarTrigger ? "md:hidden" : ""}`} aria-label="赛域首页">
            <span className="brand-mark grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><RadarMark /></span>
            <span className="hidden sm:block"><span className="block text-base font-black tracking-[0.18em] text-foreground">赛域</span><span className="block text-[9px] tracking-[0.14em] text-subtle">MATCH CONTROL</span></span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
            {links.map(({ href, label, icon: Icon }) => <Button key={href} variant="ghost" asChild className={active === label ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}><a href={href} aria-current={active === label ? "page" : undefined}><Icon />{label}</a></Button>)}
            <Button variant="ghost" asChild className={active === "战力" ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}><a href="/rankings" aria-current={active === "战力" ? "page" : undefined}>战力</a></Button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="border-border bg-card text-muted-foreground hover:text-foreground"><a href="/search" aria-label="搜索赛事或战队"><Search /><span className="hidden 2xl:inline">搜索赛事 / 战队</span></a></Button>
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" aria-label="通知" className="text-muted-foreground hover:bg-surface-hover hover:text-foreground"><a href="/notifications"><Bell /></a></Button>
            <Button asChild className="bg-primary font-bold text-primary-foreground hover:bg-brand-hover"><a href="/account">账户</a></Button>
          </div>
        </div>
        <nav className="flex overflow-x-auto border-t border-border px-3 lg:hidden" aria-label="移动端主导航">
          {links.map(({ href, label }) => <a key={href} href={href} aria-current={active === label ? "page" : undefined} className={`shrink-0 px-3 py-2.5 text-sm ${active === label ? "border-b-2 border-brand font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</a>)}
          <a href="/rankings" aria-current={active === "战力" ? "page" : undefined} className={`shrink-0 px-3 py-2.5 text-sm ${active === "战力" ? "border-b-2 border-brand text-foreground" : "text-muted-foreground"}`}>战力</a>
        </nav>
      </header>
  </>;
}

export function SiteShell({ children, active }: { children: React.ReactNode; active?: string }) {
  return (
    <div className="site-body bg-background text-foreground">
      <SiteHeader active={active} />
      <div id="main-content" tabIndex={-1}>{children}</div>
      <footer className="site-footer mt-12 border-t border-border px-4 py-7 text-center text-xs leading-6 text-subtle"><p>赛域 · 授权数据优先 · 直播仅跳转官方平台 · 战力指数不代表胜率</p><p className="mt-1"><a className="hover:text-soft" href="/privacy">隐私政策</a><span className="mx-2">·</span><a className="hover:text-soft" href="/terms">服务条款</a></p></footer>
    </div>
  );
}

export function MetricBar({ label, value, color = "#d8ff3e" }: { label: string; value: number; color?: string }) {
  return <div><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono font-bold text-soft">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} /></div></div>;
}

function RadarMark() {
  return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 4v8l5.6 5.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /></svg>;
}
