'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { href: '/', label: 'ダッシュボード', icon: '🏠' },
    { href: '/series', label: 'シリーズ', icon: '🎬' },
    { href: '/assets', label: '素材ライブラリ', icon: '📁' },
    { href: '/settings', label: '設定', icon: '⚙️' },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#161620]/90 backdrop-blur-lg border-b border-white/5">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            YM Maker
                        </span>
                    </Link>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <div className="w-6 h-5 flex flex-col justify-between">
                            <motion.span
                                animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                                className="block h-0.5 w-6 bg-white rounded-full origin-center"
                            />
                            <motion.span
                                animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                                className="block h-0.5 w-6 bg-white rounded-full"
                            />
                            <motion.span
                                animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                                className="block h-0.5 w-6 bg-white rounded-full origin-center"
                            />
                        </div>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#161620] border-r border-white/10 z-50 overflow-y-auto"
                        >
                            {/* Logo */}
                            <div className="p-6 border-b border-white/5">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    YM Maker
                                </h1>
                                <div className="text-xs text-[var(--muted)] mt-1">
                                    Human-in-the-Loop
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="p-4 space-y-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/' && pathname.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                    ? 'bg-primary-500/10 text-white border border-primary-500/20'
                                                    : 'text-[var(--muted)] hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Version */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                                <div className="text-xs text-[var(--muted)] text-center">
                                    v0.1.0 (MVP)
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export function DesktopSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex w-64 border-r border-white/10 flex-col bg-[#161620] shrink-0">
            <div className="p-6 border-b border-white/5">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    YM Maker
                </h1>
                <div className="text-xs text-[var(--muted)] mt-1">
                    Human-in-the-Loop
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-primary-500/10 text-white border border-primary-500/20'
                                    : 'text-[var(--muted)] hover:bg-white/5 hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="text-xs text-[var(--muted)] text-center">
                    v0.1.0 (MVP)
                </div>
            </div>
        </aside>
    );
}
