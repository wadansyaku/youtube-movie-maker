import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_JP, Space_Grotesk } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import DebugControls from "@/components/DebugControls";

const bodyFont = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Production OS",
  description: "Production OS for digital content operations"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute -top-40 right-[-10%] h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-30%] left-[-10%] h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[var(--accent)]/15 p-2">
                  <div className="h-full w-full rounded-xl bg-[var(--accent)]/90" />
                </div>
                <div>
                  <Link href="/" className="text-lg font-semibold text-[var(--text)]">
                    Production OS
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    制作オペレーションを再現可能にする内部ツール
                  </p>
                </div>
              </div>
              <TopNav />
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
          <DebugControls />
        </div>
      </body>
    </html>
  );
}
