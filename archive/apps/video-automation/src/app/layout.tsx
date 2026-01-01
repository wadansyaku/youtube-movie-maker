import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

export const metadata: Metadata = {
    title: 'Video Automation Studio',
    description: 'Integrated video production with Remotion and job management',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja">
            <body className="antialiased">
                <div className="min-h-screen flex">
                    <Sidebar />
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
                <Toaster
                    position="bottom-right"
                    theme="dark"
                    toastOptions={{
                        style: {
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                        },
                    }}
                />
            </body>
        </html>
    );
}
