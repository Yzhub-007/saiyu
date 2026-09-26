"use client";

import { useEffect } from "react";

export function SessionKeeper() {
  useEffect(() => {
    async function refreshSession() {
      const response = await fetch("/api/auth/session");
      const body = (await response.json()) as { data?: { refreshed?: boolean } };
      if (body.data?.refreshed && !sessionStorage.getItem("saiyu-session-refreshed")) {
        sessionStorage.setItem("saiyu-session-refreshed", "1");
        window.location.reload();
      }
    }
    refreshSession().catch(() => undefined);
  }, []);
  return null;
}
