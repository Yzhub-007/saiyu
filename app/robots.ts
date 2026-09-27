import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots { const base = (process.env.SITE_URL?.trim() || "https://saiyu-esports-hub.yuzhenjun233.chatgpt.site").replace(/\/$/, ""); return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/notifications", "/calendar/"] }, sitemap: `${base}/sitemap.xml` }; }
