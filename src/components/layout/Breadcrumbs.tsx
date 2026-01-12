"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
    dashboard: "ダッシュボード",
    create: "ワークスペース",
    items: "アイテム",
    templates: "テンプレート",
    projects: "プロジェクト",
    series: "シリーズ",
    episodes: "エピソード",
    assets: "素材ライブラリ",
    runs: "生成ジョブ",
    prompts: "プロンプト",
    reviews: "レビュー",
    exports: "エクスポート",
    production: "投稿管理",
    studio: "制作スタジオ",
    "shorts-maker": "Shorts Maker",
    "cognitive-deck": "Cognitive Deck",
    ai: "AI作成",
    scenes: "シーン",
    shots: "ショット",
    settings: "設定",
};

export default function Breadcrumbs() {
    const pathname = usePathname();

    // Skip on home/workspace
    if (pathname === "/dashboard" || pathname === "/" || pathname === "/create") return null;

    const pathSegments = pathname.split("/").filter((segment) => segment);

    return (
        <nav className="flex items-center text-sm text-gray-400 mb-6">
            <Link
                href="/create"
                className="flex items-center hover:text-white transition-colors"
            >
                <Home size={16} />
            </Link>

            {pathSegments.map((segment, index) => {
                const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                const isLast = index === pathSegments.length - 1;
                const label = routeLabels[segment] || (segment.length > 20 ? segment.substring(0, 8) + "..." : segment);

                return (
                    <div key={href} className="flex items-center">
                        <ChevronRight size={14} className="mx-2 text-gray-600" />
                        {isLast ? (
                            <span className="text-white font-medium">{label}</span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-white transition-colors"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
