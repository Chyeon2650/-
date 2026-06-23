import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MINDLET · Instant Board",
  description: "생각을 가볍게 붙여 두는 개인용 메모 보드",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
