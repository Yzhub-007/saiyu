import type { Metadata } from "next";
import "./globals.css";
import { SessionKeeper } from "./session-keeper";

export const metadata: Metadata = {
  title: "赛域｜全球中文电竞赛程与数据中心",
  description: "聚合八大电竞项目的赛程、赛事数据、可解释战力分析和官方观赛入口。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased"><SessionKeeper />{children}</body>
    </html>
  );
}
