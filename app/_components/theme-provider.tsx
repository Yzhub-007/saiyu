"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" storageKey="saiyu-theme" defaultTheme="system" enableSystem>
      <ThemeChromeSync />
      {children}
    </NextThemeProvider>
  );
}

function ThemeChromeSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    // The browser chrome follows the user's switch, not only the OS preference.
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = resolvedTheme === "dark" ? "#101419" : "#f9fafb";
    });
  }, [resolvedTheme]);
  return null;
}
