import { SiteShell } from "../_components/site-shell";

export const metadata = { title: "隐私政策｜赛域" };

export default function PrivacyPage() {
  return <SiteShell><main className="mx-auto max-w-[820px] px-4 py-9 md:px-6"><h1 className="text-3xl font-black text-foreground">隐私政策</h1><p className="mt-2 text-sm text-subtle">更新日期：2026 年 9 月 27 日</p><div className="mt-7 space-y-7 text-sm leading-7 text-soft"><Policy title="我们收集的信息">使用 Google 登录或邮箱验证码登录时，我们会处理你的邮箱地址、账户标识与会话信息。使用关注、提醒和个人日历时，我们会保存相应偏好、关注对象、时区及发送记录。安全系统可能处理 IP 地址和必要的请求日志。</Policy><Policy title="使用目的">这些信息仅用于身份验证、跨设备同步关注、生成个人日历、发送你主动开启的赛事提醒、排查故障并防止滥用。</Policy><Policy title="第三方服务">身份验证与数据库由 Supabase 提供，Google 登录由 Google 提供；赛事数据可能来自 PandaScore；邮件由配置的生产发信服务发送；站点基础设施由 Cloudflare 与 Sites 承载。第三方将依据各自政策处理必要数据。</Policy><Policy title="保留与控制">你可以在账户页关闭提醒或取消关注。个人日历地址属于私密令牌，不应公开分享；如怀疑泄露，可撤销后重新生成。需要查询或删除账户数据时，请联系站点运营者。</Policy><Policy title="Cookie 与安全">我们使用必要的会话 Cookie 维持登录，不使用博彩画像。我们会采取合理安全措施，但任何互联网服务都无法保证绝对安全。</Policy><Policy title="联系我们">隐私请求与数据纠错渠道将在正式域名和运营主体确认后补充。在此之前，本网站处于受限测试阶段。</Policy></div></main></SiteShell>;
}

function Policy({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2 className="text-lg font-bold text-foreground">{title}</h2><p className="mt-2">{children}</p></section>; }
