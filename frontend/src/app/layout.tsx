import type { Metadata } from "next";
import { Roboto_Flex, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin", "vietnamese"],
  weight: ["100", "300", "400", "500", "600", "700", "800", "900"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
      <body className={`${robotoFlex.variable} ${robotoMono.variable} antialiased`}>
        {children}
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
