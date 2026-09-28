import { Button } from "@/components/ui/button";

export function GoogleLoginButton({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div className="mt-5 rounded-xl border border-border bg-surface-inset p-4 text-xs leading-5 text-muted-foreground">
        Google 登录入口已接入，等待完成 Google 与 Supabase 授权配置后开放。
      </div>
    );
  }
  return (
    <Button asChild className="mt-5 w-full border border-border bg-white font-bold text-zinc-900 hover:bg-zinc-200">
      <a href="/api/auth/google?next=/account" target="_top">
        <span aria-hidden className="text-base font-black text-[#4285f4]">G</span>
        使用 Google 登录
      </a>
    </Button>
  );
}
