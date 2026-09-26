# 生产数据与邮箱登录配置

## PandaScore

在 Sites 项目的运行环境变量中配置 `PANDASCORE_TOKEN`。配置后，首页、
赛程中心、比赛详情 API 和 ICS 会优先读取 PandaScore 的 running、
upcoming 与 past 赛程；服务端使用 45 秒缓存，并在上游不可用时自动回退
到演示数据，同时在 API `meta` 中标记 `source`、`stale` 和警告信息。

当前授权聚合覆盖英雄联盟、无畏契约、CS2、Dota 2 等 PandaScore 已支持
项目。王者荣耀、和平精英、PUBG 与 MLBB 仍应按授权情况接官方数据源，
不要用网页抓取代替。

## Supabase 邮箱六位验证码

在 Sites 项目的运行环境变量中配置：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

随后在 Supabase 控制台完成：

1. Authentication > URL Configuration 中将 Site URL 设为生产站点地址。
2. Authentication > Email Templates 的登录模板中使用 `{{ .Token }}`，
   使邮件发送六位验证码而不是魔法链接。
3. 配置生产 SMTP。推荐连接已验证域名的 Resend、Postmark 或其他 SMTP
   服务，不要使用 Supabase 默认测试发信额度。
4. 保留 Supabase 默认的一分钟请求间隔，按风险需要启用 CAPTCHA。

站点通过服务端路由发送和验证 OTP；会话写入 `HttpOnly`、`Secure`、
`SameSite=Lax` Cookie。关注和提醒 API 同时支持 Supabase 用户和 Sites
所有者身份，运营后台仍只允许 Sites 所有者进入。

## 上线检查

- `/api/v1/matches` 的 `meta.source` 应为 `pandascore`。
- `/account` 应显示邮箱输入框，验证码邮件应来自已验证发件域名。
- OTP 连续请求应返回一分钟限流，错误验证码不得创建会话。
- 登录后保存提醒设置，刷新页面后设置应从 D1 正确恢复。
- 公开发布前将 Sites 访问范围切换为公开，否则外部用户会先遇到 Sites
  所有者访问保护，无法进入邮箱登录页。
