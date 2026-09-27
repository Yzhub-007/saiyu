import type { Match } from "./esports-data";

export function isReminderEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.REMINDER_FROM_EMAIL?.trim());
}

export function isReminderDeliveryEnabled() {
  return isReminderEmailConfigured() && Boolean(process.env.REMINDER_CRON_SECRET?.trim()) && process.env.REMINDER_SCHEDULER_ENABLED === "true";
}

export async function sendReminderEmail({ to, match, lead, siteUrl }: { to: string; match: Match; lead: "24h" | "15m"; siteUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.REMINDER_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;
  const when = new Date(match.startsAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
  const leadText = lead === "24h" ? "将在 24 小时后开始" : "将在 15 分钟后开始";
  const url = `${siteUrl.replace(/\/$/, "")}/matches/${encodeURIComponent(match.id)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: `${match.teamA} vs ${match.teamB} ${leadText}`, html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</h2><p>${escapeHtml(match.league)} · ${escapeHtml(match.stage)}</p><p>开赛时间：${escapeHtml(when)}</p><p><a href="${url}">查看比赛详情与官方观赛入口</a></p><p style="color:#777;font-size:12px">你收到此邮件是因为在赛域关注了相关战队或赛事，可在账户页关闭邮件提醒。</p></div>` }),
  });
  return response.ok;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
