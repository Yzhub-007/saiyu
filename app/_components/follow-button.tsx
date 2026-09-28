"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FollowTarget = "game" | "tournament" | "team";

export function FollowButton({ entityType, entityId, label = "关注" }: { entityType: FollowTarget; entityId: string; label?: string }) {
  const router = useRouter();
  const [followed, setFollowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/follows")
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ data?: Array<{ entityType: string; entityId: string }> }>;
      })
      .then((body) => {
        if (!active) return;
        setFollowed(Boolean(body?.data?.some((item) => item.entityType === entityType && item.entityId === entityId)));
        setReady(true);
      })
      .catch(() => active && setReady(true));
    return () => { active = false; };
  }, [entityId, entityType]);

  async function toggle() {
    setWorking(true);
    const response = followed
      ? await fetch(`/api/v1/follows?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, { method: "DELETE" })
      : await fetch("/api/v1/follows", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityType, entityId }) });
    if (response.status === 401) {
      router.push(`/account?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (response.ok) setFollowed((value) => !value);
    setWorking(false);
  }

  return (
    <Button type="button" onClick={toggle} disabled={working || !ready} variant={followed ? "outline" : "default"} className={followed ? "border-brand/30 bg-primary/5 text-brand" : "bg-primary font-bold text-primary-foreground hover:bg-brand-hover"}>
      {working ? <Loader2 className="animate-spin" /> : followed ? <Check /> : <BellPlus />}
      {followed ? "已关注" : label}
    </Button>
  );
}
