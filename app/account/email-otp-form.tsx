"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Loader2, LogOut, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EmailOtpForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "code" | "working" | "error">("email");
  const [message, setMessage] = useState("");

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setStep("working");
    const response = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!response.ok) {
      setMessage(errorMessage(body.error, body.message));
      setStep("error");
      return;
    }
    setStep("code");
    setMessage("验证码已发送，请检查邮箱。");
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setStep("working");
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!response.ok) {
      setMessage(errorMessage(body.error, body.message));
      setStep("error");
      return;
    }
    window.location.reload();
  }

  if (!configured) {
    return (
      <div className="mt-5 rounded-xl border border-[#ffb24b]/20 bg-[#ffb24b]/[0.04] p-4 text-xs leading-5 text-[#d6ad6a]">
        邮箱登录代码已接入，等待配置 Supabase 项目地址、匿名密钥与生产 SMTP 后启用。
      </div>
    );
  }

  const waiting = step === "working";
  const enteringCode = step === "code" || (step === "error" && token.length > 0);
  const validTokenLength = token.length >= 6 && token.length <= 10;
  return (
    <form onSubmit={enteringCode ? verifyCode : requestCode} className="mt-5 space-y-3">
      <label className="block text-xs font-semibold text-zinc-500" htmlFor="email">
        邮箱地址
      </label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        required
        disabled={step === "code" || waiting}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@example.com"
        className="border-white/10 bg-black/20 text-white"
      />
      {enteringCode && (
        <>
          <label className="block text-xs font-semibold text-zinc-500" htmlFor="token">
            邮箱验证码
          </label>
          <Input
            id="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            required
            value={token}
            onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="请输入 6–10 位数字"
            className="border-white/10 bg-black/20 font-mono tracking-[0.35em] text-white"
          />
        </>
      )}
      {message && (
        <p className={`text-xs ${step === "error" ? "text-[#ff7180]" : "text-[#9ab529]"}`}>
          {message}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={waiting || (enteringCode && !validTokenLength)}
          className="flex-1 bg-[#d8ff3e] font-bold text-[#10140d] hover:bg-[#c6ed2f]"
        >
          {waiting ? <Loader2 className="animate-spin" /> : step === "code" ? <Check /> : <Mail />}
          {waiting ? "处理中" : step === "code" ? "验证并登录" : "发送验证码"}
          {!waiting && step === "email" && <ArrowRight />}
        </Button>
        {(step === "code" || step === "error") && (
          <Button
            type="button"
            variant="outline"
            aria-label="重新输入邮箱"
            onClick={() => {
              setStep("email");
              setToken("");
              setMessage("");
            }}
            className="border-white/10 bg-transparent text-zinc-400"
          >
            <RotateCcw />
          </Button>
        )}
      </div>
      <p className="text-[11px] leading-5 text-zinc-600">
        验证码一分钟内只能请求一次；登录即表示同意隐私政策与服务条款。
      </p>
    </form>
  );
}

export function SupabaseLogoutButton() {
  const [working, setWorking] = useState(false);
  async function logout() {
    setWorking(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }
  return (
    <Button
      type="button"
      variant="outline"
      onClick={logout}
      disabled={working}
      className="mt-4 w-full border-white/10 bg-transparent text-zinc-400"
    >
      {working ? <Loader2 className="animate-spin" /> : <LogOut />}
      退出邮箱账户
    </Button>
  );
}

function errorMessage(code?: string, upstream?: string) {
  if (code === "otp_rate_limited") return "请求过于频繁，请一分钟后再试。";
  if (code === "invalid_email") return "请输入有效的邮箱地址。";
  if (code === "email_login_not_configured") return "邮箱登录尚未完成生产配置。";
  if (code === "invalid_otp_payload") return "请输入邮件中的 6–10 位数字验证码。";
  if (code === "otp_verification_failed") return upstream || "验证码无效或已过期。";
  return upstream || "暂时无法完成操作，请稍后重试。";
}
