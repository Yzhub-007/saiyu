"use client";

import { useState } from "react";
import { Map, Swords } from "lucide-react";

export function ReferenceImage({ src, name, kind }: { src: string | null; name: string; kind: "cs-map" | "lol-champion" | "dota-hero" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const Icon = kind === "cs-map" ? Map : Swords;
    return <span role="img" aria-label={`${name}暂无可用图片`} className="grid h-24 w-full place-items-center bg-surface-hover text-subtle"><Icon className="size-7" /></span>;
  }
  return <span role="img" aria-label={name} className="block h-24 w-full bg-[#f4f5f1]">
    {/* Provider assets have variable hosts, so native lazy loading keeps the fallback reliable. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="size-full object-contain p-2" onError={() => setFailed(true)} />
  </span>;
}
