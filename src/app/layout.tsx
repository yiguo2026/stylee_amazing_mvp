import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stylee - AI 私人穿搭顾问",
  description: "你的 AI 私人穿搭顾问，从衣橱出发，穿出更好的自己",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
