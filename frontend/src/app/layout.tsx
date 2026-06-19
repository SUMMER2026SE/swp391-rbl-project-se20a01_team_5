import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "UniBus — Hệ thống Xe bus Sinh viên liên kết trường ĐH",
  description:
    "Hệ thống xe đưa đón sinh viên liên kết trường đại học tại Đà Nẵng: đăng nhập Google, xác định trường, tuyến theo campus, vé tháng trợ giá.",
  keywords: ["bus", "sinh viên", "trường đại học", "Đà Nẵng", "tuyến xe", "vé tháng trợ giá"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{
          "--font-roboto-flex": '"Roboto Flex", "Roboto", "Segoe UI", system-ui, sans-serif',
          "--font-roboto-mono": '"Roboto Mono", "JetBrains Mono", "Cascadia Code", monospace',
        } as CSSProperties}
      >
        {children}
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
