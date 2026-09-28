# 队标与比赛更新

## 已接入

- 队标来自 PandaScore `opponents[].opponent.image_url`，只接受 HTTPS 图片地址；缺图或图片加载失败时显示通用盾牌，不能冒充官方队标。图片按原比例显示在浅色底板上，兼容两套主题。
- `results[].score` 按 `team_id` 对齐为**系列比分**。真实 0 保留，缺失值为 `null`，不能用 0 补齐。
- `games[]` 提供单局顺序、状态和胜者，但不含赛中回合／击杀比分。
- 首页、赛程与比赛详情每 30 秒轮询本站 API；隐藏页面暂停、返回页面立即刷新、请求超时或失败保留旧值并提示。刷新不重置筛选条件。
- 列表与详情有 30 秒服务端缓存和请求合并。API 禁止浏览器/CDN缓存；更新时间取实际数据时间，不取客户端刷新时间。整个列表刷新失败时保留完整快照，不用残缺列表覆盖。

## 尚未接通：实时小比分

2026-09-28 对当前配置进行只读验证：CS2 与 LoL 单局 REST 详情返回 403；标准 Live WebSocket 握手后关闭码为 `4003`（订阅权限不足）。因此目前只显示真实单局进度和不可用说明，不显示虚构小比分。

上线赛中小比分前，需要具备对应项目及赛事的 Live 授权，再实施、验证服务端共享标准 Frames 连接。公开网页不能直接取得 PandaScore token；不得每个访客各连一个上游（官方每场每 endpoint 最多 3 个连接）。`live.supported` 只代表覆盖，不代表当前订阅有权读取。

- CS2：`counter_terrorists.round_score` / `terrorists.round_score`，按双方 `id` 对齐，不能把换边后的 CT/T 固定当作队伍 A/B。
- LoL：`red.kills` / `blue.kills`，同样按队伍 `id` 对齐。
- Valorant：当前官方不提供赛中 Live 方案。提高 REST 轮询频率不能生成实时小比分。
- 不使用禁止公开分发的 Low Latency Feed。赛后 Historical REST 也不能被标为赛中实时数据。

官方参考：[套餐](https://developers.pandascore.co/docs/plan-reference)、[标准 WebSocket](https://developers.pandascore.co/docs/websockets-overview)、[关闭码](https://developers.pandascore.co/docs/disconnections)。

## 回归

```sh
node --test scripts/test-match-data.mjs
node scripts/test-match-service.mjs
node scripts/test-match-polling.mjs
npx tsc --noEmit --incremental false
npm run build
```

测试使用内存 fixtures，不访问真实数据源或读取真实令牌。
