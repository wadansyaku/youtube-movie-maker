"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FolderKanban,
    Film,
    Image,
    Wand2,
    FileText,
    MessageSquare,
    Download,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User,
    Sparkles,
    CreditCard,
    Scissors,
    Youtube,
    Bot,
    Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLayout } from "./LayoutContext";
import NotificationBell from "@/components/common/NotificationBell";

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: number | string; // Updated badge type to allow string
}

// Navigation Items - Simplified
const mainNavItems: NavItem[] = [
    { href: "/studio", label: "統合スタジオ", icon: <Sparkles size={20} /> },
    { href: "/shorts-maker", label: "Shorts制作", icon: <Youtube size={20} /> },
    { href: "/content-planner", label: "30日企画", icon: <Calendar size={20} /> },
    { href: "/prompt-generator", label: "プロンプト生成", icon: <Wand2 size={20} />, badge: "AI" },
    { href: "/automation", label: "自動制作", icon: <Bot size={20} /> },
    { href: "/assets", label: "素材ライブラリ", icon: <Image size={20} /> },
];

const advancedNavItems: NavItem[] = [
    { href: "/dashboard", label: "ダッシュボード", icon: <LayoutDashboard size={20} /> },
    { href: "/production", label: "制作ボード", icon: <FolderKanban size={20} /> },
    { href: "/series", label: "シリーズ", icon: <Film size={20} /> },
    { href: "/projects", label: "プロジェクト", icon: <FolderKanban size={20} /> },
    { href: "/video-editor", label: "動画エディタ", icon: <Scissors size={20} /> },
    { href: "/ai-tools", label: "AI Tools", icon: <Sparkles size={20} /> },
    { href: "/runs", label: "生成ジョブ", icon: <Wand2 size={20} /> },
    { href: "/prompts", label: "プロンプト", icon: <FileText size={20} /> },
    { href: "/reviews", label: "レビュー", icon: <MessageSquare size={20} /> },
    { href: "/exports", label: "エクスポート", icon: <Download size={20} /> },
    { href: "/billing", label: "プラン・請求", icon: <CreditCard size={20} /> },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isSidebarCollapsed, toggleSidebar } = useLayout();
    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === href || pathname === "/";
        return pathname.startsWith(href);
    };

    const isAdvancedRoute = advancedNavItems.some((item) => isActive(item.href));
    const [showAdvanced, setShowAdvanced] = useState(isAdvancedRoute);

    useEffect(() => {
        if (isAdvancedRoute) {
            setShowAdvanced(true);
        }
    }, [isAdvancedRoute]);

    const NavLink = ({ item }: { item: NavItem }) => (
        <Link
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive(item.href)
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
                } `}
        >
            <span className="flex-shrink-0">{item.icon}</span>
            <AnimatePresence>
                {!isSidebarCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>
            {item.badge && !isSidebarCollapsed && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {item.badge}
                </span>
            )}
            {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                </div>
            )}
        </Link>
    );

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarCollapsed ? 72 : 240 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
                <AnimatePresence>
                    {!isSidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Wand2 size={18} className="text-white" />
                            </div>
                            <span className="font-bold text-white">YMM</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ml-auto"
                >
                    {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-6 overflow-y-auto overflow-x-hidden">
                {/* Main */}
                <div className="space-y-1">
                    {!isSidebarCollapsed && (
                        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Main
                        </p>
                    )}
                    {mainNavItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                    ))}
                </div>

                {/* Advanced */}
                <div className="space-y-1">
                    {!isSidebarCollapsed && (
                        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Advanced
                        </p>
                    )}
                    <button
                        onClick={() => setShowAdvanced((prev) => !prev)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${showAdvanced
                            ? "bg-gray-800 text-white"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                        aria-expanded={showAdvanced}
                        aria-label="詳細機能の表示切り替え"
                    >
                        <ChevronRight
                            size={18}
                            className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                        />
                        {!isSidebarCollapsed && <span className="text-sm font-medium">詳細機能</span>}
                    </button>
                    <AnimatePresence initial={false}>
                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-1 overflow-hidden"
                            >
                                {advancedNavItems.map((item) => (
                                    <NavLink key={item.href} item={item} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            {/* User Section */}
            <div className="p-3 border-t border-gray-800 flex-shrink-0">
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/settings")
                        ? "bg-indigo-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                        } `}
                >
                    <Settings size={20} className="flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">設定</span>}
                </Link>
                <div className="flex items-center gap-2 px-3 py-2.5 mt-1">
                    <NotificationBell userId="admin-user" /> {/* Mock User ID */}
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-gray-400" />
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">User</p>
                            <p className="text-xs text-gray-500 truncate">user@example.com</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
