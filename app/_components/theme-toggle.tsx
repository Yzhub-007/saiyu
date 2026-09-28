"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  return (
    <Button
      type="button"
      variant="ghost"
      className="theme-toggle"
      aria-label="切换日夜模式"
      aria-pressed={mounted ? resolvedTheme === "dark" : undefined}
      title="切换日夜模式"
      onClick={(event) => {
        document.documentElement.dataset.themeMotion = event.detail === 0 ? "off" : "on";
        setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
      }}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
        <Sun className="theme-sun" />
        <Moon className="theme-moon" />
      </span>
      <span className="theme-label-light">日间</span>
      <span className="theme-label-dark">夜间</span>
    </Button>
  );
}
