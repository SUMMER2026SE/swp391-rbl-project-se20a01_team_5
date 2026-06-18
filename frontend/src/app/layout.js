import { Inter, JetBrains_Mono } from "next/font/google";
import "material-symbols/rounded.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "UniBus | Hệ thống kết nối xe đưa đón sinh viên",
  description: "Giải pháp di chuyển an toàn và tiện lợi cho sinh viên Đà Nẵng",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased selection:bg-brand-secondary selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
