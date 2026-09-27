import { LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "../auth";
import { chatGPTSignOutPath } from "../chatgpt-auth";
import { isSupabaseConfigured } from "@/lib/supabase-auth";
import { SiteShell } from "../_components/site-shell";
import { EmailOtpForm, SupabaseLogoutButton } from "./email-otp-form";
import { PreferencesPanel } from "./preferences-panel";
import { isReminderDeliveryEnabled } from "@/lib/reminder-mail";

export const dynamic = "force-dynamic";
export const metadata = { title: "账户与提醒｜赛域" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  const supabaseConfigured = isSupabaseConfigured();
  const reminderEmailEnabled = isReminderDeliveryEnabled();

  return (
    <SiteShell>
      <main className="mx-auto max-w-[980px] px-4 py-8 md:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#9ab529]">ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-black text-white">账户与提醒</h1>
          <p className="mt-2 text-sm text-zinc-500">邮箱验证码登录、关注同步与赛事提醒。</p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#101419] p-5">
            {user ? (
              <>
                <span className="grid size-12 place-items-center rounded-full bg-[#d8ff3e]/10 text-[#d8ff3e]">
                  <UserRound />
                </span>
                <p className="mt-4 font-bold text-white">{user.displayName}</p>
                <p className="mt-1 break-all text-xs text-zinc-600">{user.email}</p>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2 text-xs text-zinc-500">
                  {user.authProvider === "supabase" ? (
                    <>
                      <Mail className="size-4 text-[#d8ff3e]" />邮箱验证码账户
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 text-[#8fa827]" />站点所有者安全账户
                    </>
                  )}
                </div>
                {user.authProvider === "supabase" ? (
                  <SupabaseLogoutButton />
                ) : (
                  <>
                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 p-3 text-xs leading-5 text-zinc-500">
                      <LockKeyhole className="mb-2 size-4 text-[#8fa827]" />
                      当前私有站点仍由所有者身份保护。下面可同时测试正式邮箱登录。
                    </div>
                    <EmailOtpForm configured={supabaseConfigured} turnstileSiteKey={process.env.TURNSTILE_SITE_KEY?.trim()} />
                    <Button
                      variant="outline"
                      asChild
                      className="mt-4 w-full border-white/10 bg-transparent text-zinc-400"
                    >
                      <a href={chatGPTSignOutPath("/")} target="_top">退出站点账户</a>
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="grid size-12 place-items-center rounded-full bg-white/[0.05] text-zinc-500">
                  <Mail />
                </span>
                <h2 className="mt-4 font-bold text-white">邮箱验证码登录</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  无需设置密码，验证码登录后可跨设备同步关注与提醒。
                </p>
                <EmailOtpForm configured={supabaseConfigured} turnstileSiteKey={process.env.TURNSTILE_SITE_KEY?.trim()} />
              </>
            )}
          </aside>
          <PreferencesPanel signedIn={Boolean(user)} reminderEmailEnabled={reminderEmailEnabled} />
        </div>
      </main>
    </SiteShell>
  );
}
