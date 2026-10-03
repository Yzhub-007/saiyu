"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "./_components/site-shell";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SiteShell><main className="mx-auto max-w-2xl px-4 py-16 text-center">
    <AlertTriangle className="mx-auto size-10 text-warning" aria-hidden="true" />
    <h1 className="mt-5 text-2xl font-bold">暂时无法加载这个页面</h1>
    <p className="mt-3 text-base leading-7 text-muted-foreground">请稍后重试，或先返回赛事总览。刷新失败不表示比赛已结束。</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={reset}>重新加载</Button><Button asChild variant="outline"><a href="/">返回总览</a></Button></div>
  </main></SiteShell>;
}
