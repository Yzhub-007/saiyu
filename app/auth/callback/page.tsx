"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const [message, setMessage] = useState("正在完成 Google 登录…");

  useEffect(() => {
    async function finish() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const next = safeNext(query.get("next"));
      if (!accessToken || !refreshToken) {
        setMessage(hash.get("error_description") || "Google 登录未完成，请返回账户页重试。");
        return;
      }
      const response = await fetch("/api/auth/oauth-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          expiresIn: Number(hash.get("expires_in")) || 3600,
        }),
      });
      if (!response.ok) {
        setMessage("登录会话验证失败，请返回账户页重试。");
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      window.location.replace(next);
    }
    void finish();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#080b0f] px-5 text-center text-zinc-300">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#101419] p-8">
        <Loader2 className="mx-auto size-7 animate-spin text-[#d8ff3e]" />
        <p className="mt-4 text-sm leading-6">{message}</p>
        <a className="mt-5 inline-block text-sm font-semibold text-[#d8ff3e]" href="/account">返回账户页</a>
      </div>
    </main>
  );
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}
