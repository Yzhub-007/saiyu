import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "./_components/site-shell";

export default function NotFound() {
  return <SiteShell><main className="mx-auto max-w-2xl px-4 py-16 text-center">
    <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
    <p className="mt-5 text-sm font-semibold text-brand">404</p>
    <h1 className="mt-2 text-2xl font-bold">没有找到这条内容</h1>
    <p className="mt-3 text-base leading-7 text-muted-foreground">链接可能已失效，或这场比赛、战队尚未被数据源收录。你可以回到赛程，或重新搜索。</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><a href="/schedule">查看赛程</a></Button><Button asChild variant="outline"><a href="/search">搜索内容</a></Button></div>
  </main></SiteShell>;
}
