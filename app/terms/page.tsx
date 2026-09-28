import { SiteShell } from "../_components/site-shell";

export const metadata = { title: "服务条款｜赛域" };

export default function TermsPage() {
  return <SiteShell><main className="mx-auto max-w-[820px] px-4 py-9 md:px-6"><h1 className="text-3xl font-black text-foreground">服务条款</h1><p className="mt-2 text-sm text-subtle">更新日期：2026 年 9 月 27 日</p><div className="mt-7 space-y-7 text-sm leading-7 text-soft"><Term title="服务性质">赛域提供电竞赛程聚合、赛事资料、关注提醒、个人日历与官方观赛入口。本站不提供投注、赔率建议、自建直播或未经授权的视频内容。</Term><Term title="数据准确性">我们优先采用授权或官方来源并标示更新时间，但赛程、阵容、直播地区限制仍可能临时变化。重要决定请以赛事主办方最终公告为准。</Term><Term title="战力指标">战力指数仅用于解释近期竞技状态，不是胜率、投注建议或结果保证。数据样本不足时不展示总分。</Term><Term title="账户责任">你应妥善保护邮箱、验证码、会话和个人日历令牌，不得利用服务实施攻击、批量滥用、绕过访问控制或侵犯第三方权利。</Term><Term title="外部链接与知识产权">直播及第三方页面由各自运营者负责；战队、赛事、游戏名称与标识归相关权利人所有。本站提供链接不代表对第三方服务作出保证。</Term><Term title="变更与终止">测试期间功能、覆盖范围和可用性可能调整。严重滥用或安全风险可能导致访问被限制。正式商业上线前将补充运营主体、联系方式及适用法律信息。</Term></div></main></SiteShell>;
}

function Term({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2 className="text-lg font-bold text-foreground">{title}</h2><p className="mt-2">{children}</p></section>; }
