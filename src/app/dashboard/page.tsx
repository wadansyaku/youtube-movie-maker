"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FolderKanban,
    Film,
    Image as ImageIcon,
    Music,
    FileVideo,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus,
    ArrowRight,
    TrendingUp,
} from "lucide-react";

interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    totalSeries: number;
    activeSeries: number;
    totalAssets: number;
    pendingReviews: number;
    recentActivity: {
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        createdAt: string;
        user?: { name: string | null };
    }[];
    recentProjects: {
        id: string;
        name: string;
        status: string;
        updatedAt: string;
        _count: { scenes: number; projectAssets: number };
    }[];
    recentSeries: {
        id: string;
        title: string;
        status: string;
        updatedAt: string;
        _count: { productionEpisodes: number };
    }[];
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    in_progress: "bg-blue-500",
    review: "bg-yellow-500",
    completed: "bg-green-500",
    active: "bg-blue-500",
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"projects" | "series">("projects");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/dashboard");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "たった今";
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;
        return date.toLocaleDateString('ja-JP');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
                    <p className="text-gray-400 mt-1">YouTube Movie Makerへようこそ</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/series/new"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                    >
                        <Plus size={18} />
                        シリーズ作成
                    </Link>
                    <Link
                        href="/projects?new=true"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        プロジェクト作成
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">プロジェクト総数</p>
                            <p className="text-3xl font-bold text-white mt-1">
                                {stats?.totalProjects || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                            <FolderKanban size={24} className="text-indigo-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm">
                        <span className="text-green-400">{stats?.activeProjects || 0}</span>
                        <span className="text-gray-500">アクティブ</span>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">シリーズ総数</p>
                            <p className="text-3xl font-bold text-white mt-1">
                                {stats?.totalSeries || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                            <Film size={24} className="text-purple-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm">
                        <span className="text-green-400">{stats?.activeSeries || 0}</span>
                        <span className="text-gray-500">アクティブ</span>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">アセット総数</p>
                            <p className="text-3xl font-bold text-white mt-1">
                                {stats?.totalAssets || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                            <ImageIcon size={24} className="text-blue-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                        <FileVideo size={14} /> <Music size={14} /> <ImageIcon size={14} />
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">レビュー待ち</p>
                            <p className="text-3xl font-bold text-white mt-1">
                                {stats?.pendingReviews || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                            <Clock size={24} className="text-yellow-400" />
                        </div>
                    </div>
                    <Link
                        href="/reviews?status=pending"
                        className="flex items-center gap-1 mt-3 text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        すべて見る <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Works (Projects & Series) */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveTab("projects")}
                                className={`font-semibold text-sm transition-colors ${activeTab === "projects" ? "text-white" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                最近のプロジェクト
                            </button>
                            <button
                                onClick={() => setActiveTab("series")}
                                className={`font-semibold text-sm transition-colors ${activeTab === "series" ? "text-white" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                最近のシリーズ
                            </button>
                        </div>
                        <Link
                            href={activeTab === "projects" ? "/projects" : "/series"}
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            すべて見る
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {activeTab === "projects" ? (
                            stats?.recentProjects.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <FolderKanban size={32} className="mx-auto mb-2" />
                                    <p>プロジェクトがありません</p>
                                    <Link
                                        href="/projects?new=true"
                                        className="text-indigo-400 text-sm mt-2 inline-block hover:text-indigo-300"
                                    >
                                        最初のプロジェクトを作成
                                    </Link>
                                </div>
                            ) : (
                                stats?.recentProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full ${statusColors[project.status] || "bg-gray-500"}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">{project.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {project._count.scenes} scenes • {project._count.projectAssets} assets
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(project.updatedAt)}
                                        </span>
                                        <ArrowRight size={16} className="text-gray-600" />
                                    </Link>
                                ))
                            )
                        ) : (
                            stats?.recentSeries.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Film size={32} className="mx-auto mb-2" />
                                    <p>シリーズがありません</p>
                                    <Link
                                        href="/series/new"
                                        className="text-indigo-400 text-sm mt-2 inline-block hover:text-indigo-300"
                                    >
                                        最初のシリーズを作成
                                    </Link>
                                </div>
                            ) : (
                                stats?.recentSeries.map((series) => (
                                    <Link
                                        key={series.id}
                                        href={`/series/${series.id}`}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full ${statusColors[series.status] || "bg-gray-500"}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">{series.title}</p>
                                            <p className="text-sm text-gray-500">
                                                {series._count.productionEpisodes} episodes
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(series.updatedAt)}
                                        </span>
                                        <ArrowRight size={16} className="text-gray-600" />
                                    </Link>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-700">
                        <h2 className="font-semibold text-white">最近のアクティビティ</h2>
                    </div>
                    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {stats?.recentActivity.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">アクティビティはありません</p>
                        ) : (
                            stats?.recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-3 text-sm"
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full mt-1.5 ${activity.action === "create"
                                            ? "bg-green-500"
                                            : activity.action === "update"
                                                ? "bg-blue-500"
                                                : activity.action === "delete"
                                                    ? "bg-red-500"
                                                    : "bg-gray-500"
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-300">
                                            <span className="capitalize">{activity.action}</span>{" "}
                                            <span className="text-gray-400">{activity.entityType}</span>
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {formatDate(activity.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/projects?new=true"
                    className="flex flex-col items-center gap-2 p-6 bg-gray-900 border border-gray-700 rounded-xl hover:border-indigo-500 transition-colors group"
                >
                    <FolderKanban size={32} className="text-gray-400 group-hover:text-indigo-400" />
                    <span className="text-sm text-gray-300">プロジェクト作成</span>
                </Link>
                <Link
                    href="/series/new"
                    className="flex flex-col items-center gap-2 p-6 bg-gray-900 border border-gray-700 rounded-xl hover:border-purple-500 transition-colors group"
                >
                    <Film size={32} className="text-gray-400 group-hover:text-purple-400" />
                    <span className="text-sm text-gray-300">シリーズ作成</span>
                </Link>
                <Link
                    href="/assets"
                    className="flex flex-col items-center gap-2 p-6 bg-gray-900 border border-gray-700 rounded-xl hover:border-blue-500 transition-colors group"
                >
                    <ImageIcon size={32} className="text-gray-400 group-hover:text-blue-400" />
                    <span className="text-sm text-gray-300">素材ライブラリ</span>
                </Link>
                <Link
                    href="/runs"
                    className="flex flex-col items-center gap-2 p-6 bg-gray-900 border border-gray-700 rounded-xl hover:border-teal-500 transition-colors group"
                >
                    <TrendingUp size={32} className="text-gray-400 group-hover:text-teal-500" />
                    <span className="text-sm text-gray-300">生成ジョブ</span>
                </Link>
            </div>
        </div>
    );
}
