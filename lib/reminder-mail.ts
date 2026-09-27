import type { Match } from "./esports-data";
import { createUnsubscribeToken } from "./unsubscribe-token";

export function isReminderEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.REMINDER_FROM_EMAIL?.trim());
}

export function isReminderDeliveryEnabled() {
  return isReminderEmailConfigured() && Boolean(process.env.REMINDER_CRON_SECRET?.trim()) && Boolean(process.env.REMINDER_UNSUBSCRIBE_SECRET?.trim()) && process.env.REMINDER_SCHEDULER_ENABLED === "true";
}

export async function sendReminderEmail({ userId, to, match, lead, siteUrl, timezone }: { userId: string; to: string; match: Match; lead: "24h" | "15m"; siteUrl: string; timezone: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.REMINDER_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;
  const baseUrl = siteUrl.replace(/\/$/, "");
  const unsubscribeToken = await createUnsubscribeToken(userId);
  if (!unsubscribeToken) return false;
  const when = new Date(match.startsAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: validTimeZone(timezone) });
  const leadText = lead === "24h" ? "将在 24 小时后开始" : "将在 15 分钟后开始";
  const url = `${baseUrl}/matches/${encodeURIComponent(match.id)}`;
  const unsubscribeUrl = `${baseUrl}/api/v1/notification-preferences/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": `reminder/${userId}/${match.id}/${lead}` },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${match.teamA} vs ${match.teamB} ${leadText}`,
      text: `${match.teamA} vs ${match.teamB}\n${match.league} · ${match.stage}\n开赛时间：${when}\n比赛详情：${url}\n停止邮件提醒：${unsubscribeUrl}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</h2><p>${escapeHtml(match.league)} · ${escapeHtml(match.stage)}</p><p>开赛时间：${escapeHtml(when)}</p><p><a href="${escapeHtml(url)}">查看比赛详情与官方观赛入口</a></p><p style="color:#777;font-size:12px">你收到此邮件是因为在赛域关注了相关战队或赛事。<a href="${escapeHtml(unsubscribeUrl)}">停止邮件提醒</a></p></div>`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!response.ok) console.error("Reminder email delivery failed", response.status);
  return response.ok;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function validTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("zh-CN", { timeZone: value }).format();
    return value;
  } catch {
    return "Asia/Shanghai";
  }
}
