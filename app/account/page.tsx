import { LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "../auth";
import { chatGPTSignOutPath } from "../chatgpt-auth";
import { isEmailOtpEnabled, isGoogleOAuthEnabled } from "@/lib/supabase-auth";
import { SiteShell } from "../_components/site-shell";
import { EmailOtpForm, SupabaseLogoutButton } from "./email-otp-form";
import { PreferencesPanel } from "./preferences-panel";
import { isReminderDeliveryEnabled } from "@/lib/reminder-mail";
import { GoogleLoginButton } from "./google-login-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "账户与提醒｜赛域" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  const emailOtpEnabled = isEmailOtpEnabled();
  const googleOAuthEnabled = isGoogleOAuthEnabled();
  const reminderEmailEnabled = isReminderDeliveryEnabled();

  return (
    <SiteShell>
      <main className="mx-auto max-w-[980px] px-4 py-8 md:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brand">ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">账户与提醒</h1>
          <p className="mt-2 text-sm text-muted-foreground">Google 登录、关注同步与赛事提醒。</p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-border bg-card p-5">
            {user ? (
              <>
                <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-brand">
                  <UserRound />
                </span>
                <p className="mt-4 font-bold text-foreground">{user.displayName}</p>
                <p className="mt-1 break-all text-xs text-subtle">{user.email}</p>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface-inset px-3 py-2 text-xs text-muted-foreground">
                  {user.authProvider === "supabase" ? (
                    <>
                      <Mail className="size-4 text-brand" />
                      {user.identityProvider === "google" ? "Google 账户" : "邮箱验证码账户"}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 text-brand" />站点所有者安全账户
                    </>
                  )}
                </div>
                {user.authProvider === "supabase" ? (
                  <SupabaseLogoutButton />
                ) : (
                  <>
                    <div className="mt-4 rounded-xl border border-border bg-surface-inset p-3 text-xs leading-5 text-muted-foreground">
                      <LockKeyhole className="mb-2 size-4 text-brand" />
                      当前私有站点仍由所有者身份保护。下面可同时测试正式邮箱登录。
                    </div>
                    <GoogleLoginButton enabled={googleOAuthEnabled} />
                    {emailOtpEnabled && <EmailOtpForm configured turnstileSiteKey={process.env.TURNSTILE_SITE_KEY?.trim()} />}
                    <Button
                      variant="outline"
                      asChild
                      className="mt-4 w-full border-border bg-transparent text-soft"
                    >
                      <a href={chatGPTSignOutPath("/")} target="_top">退出站点账户</a>
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="grid size-12 place-items-center rounded-full bg-surface-hover text-muted-foreground">
                  <Mail />
                </span>
                <h2 className="mt-4 font-bold text-foreground">登录赛域</h2>
                <p className="mt-2 text-sm leading-6 text-subtle">
                  使用 Google 账户登录后，可跨设备同步关注、提醒与个人日历。
                </p>
                <GoogleLoginButton enabled={googleOAuthEnabled} />
                {emailOtpEnabled ? (
                  <EmailOtpForm configured turnstileSiteKey={process.env.TURNSTILE_SITE_KEY?.trim()} />
                ) : (
                  <p className="mt-4 text-xs leading-5 text-subtle">邮箱验证码登录将在发信域名配置完成后开放。</p>
                )}
              </>
            )}
          </aside>
          <PreferencesPanel signedIn={Boolean(user)} reminderEmailEnabled={reminderEmailEnabled} />
        </div>
      </main>
    </SiteShell>
  );
}
