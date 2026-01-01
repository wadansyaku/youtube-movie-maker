import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import {
    Sparkles,
    Film,
    Scissors,
    Bot,
    Image,
    FileText,
    Wand2,
    Youtube,
} from "lucide-react";
import QuickPreviewWrapper from "./QuickPreviewWrapper";

async function getStats() {
    const [seriesCount, episodeCount, assetCount] = await Promise.all([
        prisma.series.count(),
        prisma.productionEpisode.count(),
        prisma.asset.count(),
    ]);

    return { seriesCount, episodeCount, assetCount };
}

type FlowAction = {
    href: string;
    title: string;
    description: string;
    badge?: string;
};

type FlowCardProps = {
    title: string;
    description: string;
    icon: ReactNode;
    accent: string;
    actions: FlowAction[];
};

function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs text-gray-400">
            <span className="text-sm font-semibold text-white">{value}</span>
            <span>{label}</span>
        </div>
    );
}

function ActionLink({ href, title, description, badge }: FlowAction) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 transition-colors hover:border-indigo-500/60"
        >
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <span>{title}</span>
                    {badge && (
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            <span className="text-xs text-gray-500 transition-transform group-hover:translate-x-1">→</span>
        </Link>
    );
}

function FlowCard({ title, description, icon, accent, actions }: FlowCardProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900/70 to-gray-950 p-6">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative z-10 space-y-4">
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                        <p className="text-xs text-gray-400">{description}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {actions.map((action) => (
                        <ActionLink key={action.href} {...action} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default async function StudioPage() {
    const stats = await getStats();

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Hero Header */}
            <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-gray-900/70 to-gray-950 p-6">
                <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="relative z-10 space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                                統合制作スタジオ
                            </p>
                            <h1 className="mt-2 text-2xl font-bold text-white">
                                YouTube制作を一元化する統合スタジオ
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-gray-300">
                                企画・AI生成・編集・書き出しをひとつの流れで管理
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/shorts-maker"
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                            >
                                <Youtube className="inline h-4 w-4 mr-1" />
                                Shorts制作
                            </Link>
                            <Link
                                href="/series/new"
                                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-indigo-500/60"
                            >
                                シリーズ作成
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <StatPill label="シリーズ" value={stats.seriesCount} />
                        <StatPill label="エピソード" value={stats.episodeCount} />
                        <StatPill label="素材" value={stats.assetCount} />
                    </div>
                </div>
            </section>

            {/* Quick Preview - NEW */}
            <QuickPreviewWrapper />

            {/* Workflow Cards */}
            <section className="grid gap-4 lg:grid-cols-3">
                <FlowCard
                    title="企画・構成"
                    description="シリーズ設計と制作管理"
                    icon={<Film className="h-5 w-5 text-indigo-200" />}
                    accent="bg-indigo-500/20 text-indigo-200"
                    actions={[
                        {
                            href: "/production",
                            title: "制作ボード",
                            description: "企画から公開までの進行を可視化",
                        },
                        {
                            href: "/series",
                            title: "シリーズ / World Bible",
                            description: "世界観とルールを統一",
                        },
                    ]}
                />
                <FlowCard
                    title="AI生成"
                    description="台本・素材・ショート動画"
                    icon={<Sparkles className="h-5 w-5 text-emerald-200" />}
                    accent="bg-emerald-500/20 text-emerald-200"
                    actions={[
                        {
                            href: "/shorts-maker",
                            title: "ショート動画を作る",
                            description: "テンプレートから簡単作成",
                        },
                        {
                            href: "/automation",
                            title: "自動制作フロー",
                            description: "JSON→プロンプト→レンダリング",
                            badge: "Beta",
                        },
                    ]}
                />
                <FlowCard
                    title="編集・書き出し"
                    description="最終編集と公開準備"
                    icon={<Scissors className="h-5 w-5 text-amber-200" />}
                    accent="bg-amber-500/20 text-amber-200"
                    actions={[
                        {
                            href: "/video-editor",
                            title: "動画エディタ",
                            description: "テキストベースで編集",
                        },
                        {
                            href: "/exports",
                            title: "エクスポート",
                            description: "メタデータ含めて書き出し",
                        },
                    ]}
                />
            </section>

            {/* Quick Links */}
            <section className="grid gap-3 md:grid-cols-4">
                <Link
                    href="/assets"
                    className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 transition hover:border-indigo-500/60"
                >
                    <div>
                        <p className="text-sm font-medium text-white">素材ライブラリ</p>
                        <p className="text-xs text-gray-500">画像・音声・動画</p>
                    </div>
                    <Image className="h-5 w-5 text-gray-400" />
                </Link>
                <Link
                    href="/prompts"
                    className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 transition hover:border-indigo-500/60"
                >
                    <div>
                        <p className="text-sm font-medium text-white">プロンプト</p>
                        <p className="text-xs text-gray-500">再利用テンプレ</p>
                    </div>
                    <FileText className="h-5 w-5 text-gray-400" />
                </Link>
                <Link
                    href="/runs"
                    className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 transition hover:border-indigo-500/60"
                >
                    <div>
                        <p className="text-sm font-medium text-white">生成ジョブ</p>
                        <p className="text-xs text-gray-500">AI生成履歴</p>
                    </div>
                    <Wand2 className="h-5 w-5 text-gray-400" />
                </Link>
                <Link
                    href="/ai-tools"
                    className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 transition hover:border-indigo-500/60"
                >
                    <div>
                        <p className="text-sm font-medium text-white">AIツール</p>
                        <p className="text-xs text-gray-500">台本・SEO・サムネ</p>
                    </div>
                    <Bot className="h-5 w-5 text-gray-400" />
                </Link>
            </section>
        </div>
    );
}
