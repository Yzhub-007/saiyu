"use client";

import { useEffect, useId, useRef, useState } from "react";

type LensMap = { url: string; width: number; height: number };
const maps = new Map<string, LensMap>();

/** Rounded-rectangle normal field. Only the curved bezel refracts; the center is neutral.
 * Technique reference: https://kube.io/blog/liquid-glass-css-svg/
 * Our displacement profile is a bounded visual approximation, not Apple's renderer.
 */
function makeLensMap(width: number, height: number, radius: number): LensMap | null {
  const key = `${width}:${height}:${radius}`;
  const cached = maps.get(key);
  if (cached) return cached;
  const ratio = Math.min(1, 960 / width, 720 / height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * ratio));
  canvas.height = Math.max(1, Math.ceil(height * ratio));
  const context = canvas.getContext("2d");
  if (!context) return null;
  const pixels = context.createImageData(canvas.width, canvas.height);
  const bezel = Math.min(18, radius * .65);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const px = (x + .5) / ratio - width / 2;
      const py = (y + .5) / ratio - height / 2;
      const qx = Math.abs(px) - (width / 2 - radius);
      const qy = Math.abs(py) - (height / 2 - radius);
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      const length = Math.hypot(ox, oy);
      const distance = length + Math.min(Math.max(qx, qy), 0) - radius;
      const nx = length > 0 ? ox / length * Math.sign(px) : qx > qy ? Math.sign(px) : 0;
      const ny = length > 0 ? oy / length * Math.sign(py) : qy >= qx ? Math.sign(py) : 0;
      const depth = -distance;
      const bend = depth >= 0 && depth < bezel ? Math.pow(1 - depth / bezel, 2) : 0;
      const offset = (y * canvas.width + x) * 4;
      pixels.data[offset] = Math.round(128 - nx * bend * 127);
      pixels.data[offset + 1] = Math.round(128 - ny * bend * 127);
      pixels.data[offset + 2] = 128;
      pixels.data[offset + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  const map = { url: canvas.toDataURL(), width, height };
  if (maps.size >= 8) maps.delete(maps.keys().next().value!);
  maps.set(key, map);
  return map;
}

export function LiquidGlass({ children, className = "", contentClassName = "", weight = "regular" }: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  weight?: "regular" | "thick";
}) {
  const host = useRef<HTMLDivElement>(null);
  const filterId = `liquid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [map, setMap] = useState<LensMap | null>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-transparency: reduce), (prefers-contrast: more)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (reduced.matches || !element.isConnected) { setMap(null); return; }
        const width = Math.round(element.clientWidth), height = Math.round(element.clientHeight);
        if (width < 8 || height < 8) return;
        const radius = Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius) || 24, width / 2, height / 2);
        setMap(makeLensMap(width, height, radius));
      }, 120);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    reduced.addEventListener("change", update);
    update();
    return () => { clearTimeout(timer); observer.disconnect(); reduced.removeEventListener("change", update); };
  }, []);

  return <div ref={host} className={`liquid-glass liquid-glass-${weight} ${className}`}>
    {/* Keep the CSS substrate independent: SVG backdrop support is not reliably feature-detectable. */}
    <span className="liquid-substrate" aria-hidden="true" />
    {map && <>
      <svg className="liquid-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
        <filter id={filterId} x="0" y="0" width={map.width} height={map.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={map.url} width={map.width} height={map.height} preserveAspectRatio="none" result="lens-map" />
          <feDisplacementMap in="SourceGraphic" in2="lens-map" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs></svg>
      <span className="liquid-refraction" style={{ backdropFilter: `url(#${filterId})`, WebkitBackdropFilter: `url(#${filterId})` }} aria-hidden="true" />
    </>}
    <span className="liquid-rim" aria-hidden="true" />
    <div className={`liquid-content ${contentClassName}`}>{children}</div>
  </div>;
}
