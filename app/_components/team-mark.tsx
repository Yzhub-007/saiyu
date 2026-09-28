"use client";

import { Shield } from "lucide-react";
import { useState, type CSSProperties } from "react";

type TeamMarkProps = {
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
  logo?: string | null;
  name?: string;
};

export function TeamMark({ label, color, size = "md", logo, name }: TeamMarkProps) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logoUrl = logo?.trim() || null;
  const hasLogo = logoUrl !== null && failedLogo !== logoUrl;
  const teamName = name?.trim() || label;
  const description = hasLogo ? `${teamName}队标` : `${teamName}：暂无可用队标，显示通用盾牌`;

  return (
    <span
      role="img"
      aria-label={description}
      title={description}
      className={`team-mark grid shrink-0 place-items-center overflow-hidden border border-border ${size === "lg" ? "size-16 rounded-2xl" : size === "sm" ? "size-6 rounded-md" : "size-11 rounded-2xl"}`}
      style={{ "--team-color": color, ...(hasLogo ? { background: "#f4f5f1" } : {}) } as CSSProperties}
    >
      {hasLogo ? (
        // Provider-hosted logos use native loading and the same fallback for every image host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={logoUrl}
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`size-full min-w-0 object-contain ${size === "sm" ? "p-0.5" : "p-1.5"}`}
          onError={() => setFailedLogo(logoUrl)}
        />
      ) : (
        <Shield aria-hidden="true" className={size === "lg" ? "size-7" : size === "sm" ? "size-3.5" : "size-5"} strokeWidth={1.5} />
      )}
    </span>
  );
}
