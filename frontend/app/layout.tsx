import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DerSonaUCV - 个性化学习平台",
  description: "AI驱动的个性化学习平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary">
              DerSonaUCV
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-slate-600 hover:text-primary transition-colors">
                首页
              </Link>
              <Link href="/progress" className="text-slate-600 hover:text-primary transition-colors">
                学习进度
              </Link>
              <Link href="/history" className="text-slate-600 hover:text-primary transition-colors">
                历史记录
              </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
