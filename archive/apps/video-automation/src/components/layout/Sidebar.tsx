'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, FolderOpen, Layout, Film, Play } from 'lucide-react';

const navItems = [
    { href: '/', label: 'ダッシュボード', icon: Home },
    { href: '/projects', label: 'プロジェクト', icon: FolderOpen },
    { href: '/templates', label: 'テンプレート', icon: Layout },
    { href: '/renders', label: 'レンダリング', icon: Film },
    { href: '/preview', label: 'プレビュー', icon: Play },
];

export function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
            <div className="p-6 border-b border-[var(--border)]">
                <h1 className="text-xl font-bold gradient-text">Video Automation</h1>
                <p className="text-sm text-[var(--muted)] mt-1">Production Studio</p>
            </div>
            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${active
                                            ? 'bg-[var(--accent)]/15 text-[var(--accent)] border-l-2 border-[var(--accent)]'
                                            : 'hover:bg-[var(--card-hover)] border-l-2 border-transparent'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'text-[var(--accent)]' : ''}`} />
                                    <span className={active ? 'font-medium' : ''}>{label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="p-4 border-t border-[var(--border)]">
                <div className="text-xs text-[var(--muted)]">Ver 1.0.0</div>
            </div>
        </aside>
    );
}
