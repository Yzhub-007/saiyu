import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

const responseHeaders = {
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
  "x-content-type-options": "nosniff",
};

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = await verifyUnsubscribeToken(token);
  if (!userId) return new Response(page("退订链接无效或已经失效", "请登录赛域，在账户设置中关闭邮件提醒。"), { status: 400, headers: { ...responseHeaders, "content-type": "text/html; charset=utf-8" } });
  const action = `/api/v1/notification-preferences/unsubscribe?token=${encodeURIComponent(token)}`;
  return new Response(page("停止赛事邮件提醒", "确认后将不再发送赛前提醒，站内提醒不会受到影响。", action), { headers: { ...responseHeaders, "content-type": "text/html; charset=utf-8" } });
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = await verifyUnsubscribeToken(token);
  if (!userId) return new Response("invalid unsubscribe token", { status: 400, headers: responseHeaders });
  await getDb().update(notificationPreferences).set({ emailEnabled: false, updatedAt: new Date().toISOString() }).where(eq(notificationPreferences.userId, userId));
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  return new Response(acceptsHtml ? page("邮件提醒已关闭", "你仍可在账户设置中重新开启。") : "email reminders disabled", { headers: { ...responseHeaders, "content-type": acceptsHtml ? "text/html; charset=utf-8" : "text/plain; charset=utf-8" } });
}

function page(title: string, message: string, action?: string) {
  const button = action ? `<form method="post" action="${action}"><button type="submit">确认停止邮件提醒</button></form>` : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#090c0f;color:#f4f4f5;font-family:system-ui,sans-serif}main{max-width:520px;margin:12vh auto;padding:32px;border:1px solid #27272a;border-radius:18px;background:#11161b}h1{font-size:24px}p{color:#a1a1aa;line-height:1.7}button{margin-top:16px;border:0;border-radius:10px;background:#d8ff3e;color:#10140d;padding:12px 18px;font-weight:700;cursor:pointer}</style></head><body><main><h1>${title}</h1><p>${message}</p>${button}</main></body></html>`;
}
