# 赛域（Saiyu）

赛域是一个面向中文用户的多项目电竞赛事聚合平台，集中展示比赛日程、实时状态、历史比分、赛事资料、战队与选手信息，并提供关注、提醒和日历订阅能力。

项目基于 Next.js、React、Vinext 与 Cloudflare Workers 构建，可接入 PandaScore 授权赛事数据、Supabase Auth、Cloudflare D1、Resend 邮件和 Turnstile。

## 主要功能

- **赛事首页**：汇总进行中、即将开始和已结束的比赛。
- **赛程中心**：支持列表、周视图和月历视图，并可按游戏项目筛选。
- **比赛详情**：展示对阵、比分、赛制、阶段、官方观赛入口和数据更新时间。
- **赛事资料**：展示赛事赛程、参赛战队和对应的资料来源。
- **战队与选手**：提供战队赛程、基础阵容和公开选手资料。
- **战力分析**：根据可用样本展示战队排名与分析结果。
- **资料库与搜索**：聚合公开赛事资料，并提供站内检索。
- **关注与提醒**：关注游戏、赛事或战队，配置站内及邮件提醒。
- **日历订阅**：下载全部赛程或单场比赛的 `.ics` 日历文件。
- **账号系统**：支持邮箱 OTP、Google OAuth，以及托管环境中的 ChatGPT 登录。
- **运营工作台**：检查缺失直播入口、待确认对阵和数据同步状态。
- **响应式主题**：支持桌面端、移动端以及浅色/深色主题。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端 | Next.js 16、React 19、TypeScript、Tailwind CSS 4 |
| UI | Base UI、Radix UI、shadcn、Lucide、Recharts |
| 运行时 | Vinext、Vite、Cloudflare Workers、Wrangler |
| 数据 | PandaScore、Cloudflare D1、Drizzle ORM |
| 认证 | Supabase Auth、Google OAuth、邮箱 OTP、ChatGPT Sign-In |
| 通知 | Resend、站内通知、ICS 日历 |
| 安全 | Cloudflare Turnstile、签名退订链接、服务端密钥 |
| 测试与质量 | Node.js Test Runner、ESLint、TypeScript |

## 页面与接口

主要页面：

- `/`：赛事首页
- `/schedule`：赛程中心
- `/tournaments`：赛事列表与详情
- `/teams`：战队列表与详情
- `/players/[id]`：选手资料
- `/rankings`：战力分析
- `/library`：资料库
- `/search`：站内搜索
- `/account`：登录与提醒偏好
- `/notifications`：站内通知
- `/admin`：运营工作台

主要 API 位于 `app/api/v1/`，覆盖比赛、赛事、战队、选手、关注、提醒偏好、日历订阅和公开集成信息。

## 环境要求

- Node.js `>= 22.13.0`
- npm（项目包含 `package-lock.json`）
- Git（仅克隆与发布时需要）

## 本地开发

```bash
git clone https://github.com/Yzhub-007/saiyu.git
cd saiyu
npm ci
copy .env.example .env.local
npm run dev
```

macOS 或 Linux 可使用：

```bash
cp .env.example .env.local
```

开发服务器默认由 Vinext 启动，通常访问 `http://localhost:5173`。如需指定端口：

```bash
npm run dev -- --port 3000
```

未配置外部赛事数据时，应用可使用仓库内置演示数据展示主要界面。

## 环境变量

从 `.env.example` 创建 `.env.local`，按需配置：

| 变量 | 是否必需 | 用途 |
| --- | --- | --- |
| `PANDASCORE_TOKEN` | 否 | 获取授权电竞赛程与比赛数据 |
| `SUPABASE_URL` | 登录功能需要 | Supabase 项目地址 |
| `SUPABASE_ANON_KEY` | 登录功能需要 | Supabase 匿名公钥 |
| `GOOGLE_OAUTH_ENABLED` | 否 | 启用 Google OAuth |
| `EMAIL_OTP_ENABLED` | 否 | 启用邮箱验证码登录 |
| `RESEND_API_KEY` | 邮件提醒需要 | 发送提醒邮件 |
| `REMINDER_FROM_EMAIL` | 邮件提醒需要 | 提醒邮件发件人 |
| `REMINDER_CRON_SECRET` | 定时任务需要 | 保护提醒任务接口 |
| `REMINDER_UNSUBSCRIBE_SECRET` | 邮件提醒需要 | 签名退订链接 |
| `REMINDER_SCHEDULER_ENABLED` | 否 | 启用提醒调度器 |
| `SITE_URL` | 生产环境建议 | 站点公开地址 |
| `TURNSTILE_SITE_KEY` | 否 | 邮箱 OTP 的前端验证密钥 |
| `TURNSTILE_SECRET_KEY` | 否 | Turnstile 服务端验证密钥 |

不要提交 `.env.local` 或任何真实访问令牌。

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建 Cloudflare Worker 产物
npm run start        # 使用 Wrangler 本地预览构建结果
npm run lint         # 执行 ESLint 检查
npm run db:generate  # 根据 Drizzle Schema 生成迁移
```

当前 `package.json` 未单独定义 `test` 脚本，测试可直接运行：

```bash
node --test tests/*.test.mjs
```

## 数据与降级策略

- 生产赛事数据可由 PandaScore 授权接口提供。
- 数据同步失败时，页面会保留最后一次成功同步的赛程或历史比分。
- 仓库包含演示赛事数据，便于无密钥状态下开发和预览。
- 外部资料链接会标明来源，避免将未经验证的数据当作正式赛事事实。
- 战力分析仅在样本满足规则时生成，不使用占位值伪造结论。

更多说明见：

- `docs/match-data.md`：比赛数据结构与同步规则
- `docs/production-integrations.md`：生产认证、提醒和外部服务接入

## Cloudflare D1

项目通过 `.openai/hosting.json` 声明 D1 绑定名 `DB`。修改 `db/schema.ts` 后生成迁移：

```bash
npm run db:generate
```

构建项目后，可将迁移应用到本地 Wrangler 状态：

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

请将迁移文件名替换为实际待执行文件，且不要重复执行已经应用的迁移。

## 构建与部署

```bash
npm ci
npm run lint
node --test tests/*.test.mjs
npm run build
npm run start
```

`npm run build` 会生成适用于 Cloudflare Worker 的 `dist/` 产物；`npm run start` 仅用于本地预览，不会自动发布线上站点。生产环境还需在托管平台配置 D1 绑定及所需环境变量。

## 项目结构

```text
app/          页面、路由、API 与业务组件
components/   通用 UI 组件
db/           D1/Drizzle 数据访问与 Schema
docs/         数据及生产集成文档
drizzle/      数据库迁移
lib/          赛事服务、数据源、认证、通知与工具函数
public/       静态资源
scripts/      安装、构建和运行辅助脚本
tests/        数据集合与刷新逻辑测试
```

## 数据来源与合规

本项目只应使用获得授权或允许公开访问的数据源。真实赛事令牌、认证密钥和邮件服务密钥必须存放在部署平台的环境变量中。各赛事名称、队伍名称、标识和商标归其各自权利人所有。

## 贡献

欢迎通过 Issue 或 Pull Request 提交问题和改进。提交前建议完成：

```bash
npm run lint
node --test tests/*.test.mjs
npm run build
```

## 许可证

仓库当前未声明开源许可证。除非仓库所有者另行授权，否则默认保留全部权利。
