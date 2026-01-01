'use client';

import { useState, useEffect } from 'react';
import { Play, FolderOpen, Film, Clock, ArrowRight, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Stats {
    totalProjects: number;
    totalRenders: number;
    pendingRenders: number;
    completedToday: number;
}

interface RecentRender {
    id: string;
    projectName: string;
    templateName: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed';
    createdAt: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        totalProjects: 0,
        totalRenders: 0,
        pendingRenders: 0,
        completedToday: 0,
    });
    const [recentRenders, setRecentRenders] = useState<RecentRender[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dashboard');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setRecentRenders(data.recentRenders);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const statusColors = {
        queued: 'badge-info',
        running: 'badge-warning',
        succeeded: 'badge-success',
        failed: 'badge-error',
    };

    const statusLabels = {
        queued: '待機中',
        running: '実行中',
        succeeded: '完了',
        failed: '失敗',
    };

    const statCards = [
        { label: 'プロジェクト', value: stats.totalProjects, icon: FolderOpen, color: 'purple' },
        { label: 'レンダリング', value: stats.totalRenders, icon: Film, color: 'blue' },
        { label: '待機中', value: stats.pendingRenders, icon: Clock, color: 'amber' },
        { label: '今日完了', value: stats.completedToday, icon: Play, color: 'green' },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">ダッシュボード</h1>
                    <p className="text-[var(--muted)]">
                        動画制作の統合管理システム
                    </p>
                </div>
                <button
                    onClick={fetchDashboard}
                    disabled={isLoading}
                    className="btn btn-secondary"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    更新
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card p-6 hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-${color}-500/15`}>
                                <Icon className={`w-6 h-6 text-${color}-400`} />
                            </div>
                            <div>
                                <p className="text-3xl font-bold tabular-nums">
                                    {isLoading ? '-' : value}
                                </p>
                                <p className="text-sm text-[var(--muted)]">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4">クイックアクション</h2>
                    <div className="space-y-3">
                        <Link
                            href="/projects"
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent hover:from-purple-500/20 transition group border border-transparent hover:border-purple-500/30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <Plus className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <span className="font-medium">新規プロジェクト作成</span>
                                    <p className="text-sm text-[var(--muted)]">動画コンテンツを作成</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            href="/preview"
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent hover:from-blue-500/20 transition group border border-transparent hover:border-blue-500/30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Play className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <span className="font-medium">プレビュー</span>
                                    <p className="text-sm text-[var(--muted)]">コンポジションを確認</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Recent Renders */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">最近のレンダリング</h2>
                        <Link href="/renders" className="text-sm text-[var(--accent)] hover:underline">
                            すべて表示
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]"></div>
                            </div>
                        ) : recentRenders.length === 0 ? (
                            <div className="text-center py-8">
                                <Film className="w-12 h-12 mx-auto text-[var(--muted)] mb-2" />
                                <p className="text-[var(--muted)]">レンダリング履歴がありません</p>
                            </div>
                        ) : (
                            recentRenders.map((render) => (
                                <Link
                                    key={render.id}
                                    href="/renders"
                                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] hover:bg-[var(--card-hover)] transition"
                                >
                                    <div>
                                        <p className="font-medium">{render.projectName}</p>
                                        <p className="text-sm text-[var(--muted)]">{render.templateName}</p>
                                    </div>
                                    <span className={`badge ${statusColors[render.status]}`}>
                                        {statusLabels[render.status]}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
