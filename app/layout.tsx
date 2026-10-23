import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "청현 · 메모 보드",
  description: "생각을 가볍게 붙이고 함께 나누는 청현 메모 보드",
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
