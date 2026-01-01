'use client';

import { useState, useEffect } from 'react';
import { Film, Download, RefreshCw, CheckCircle, XCircle, Clock, Loader2, FileText, X } from 'lucide-react';

interface Render {
    id: string;
    projectId: string;
    projectName: string;
    templateName?: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed';
    startedAt?: string;
    finishedAt?: string;
    log?: string;
    artifacts: Array<{
        id: string;
        name: string;
        uri: string;
        type: string;
    }>;
    createdAt: string;
}

export default function RendersPage() {
    const [renders, setRenders] = useState<Render[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRender, setSelectedRender] = useState<Render | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchRenders();
        // Auto-refresh every 3 seconds
        const interval = setInterval(fetchRenders, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchRenders = async () => {
        try {
            const res = await fetch('/api/renders');
            if (res.ok) {
                const data = await res.json();
                setRenders(data);
            }
        } catch (error) {
            console.error('Failed to fetch renders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRenderDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/renders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedRender(data);
            }
        } catch (error) {
            console.error('Failed to fetch render detail:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const statusIcons: Record<string, React.ReactNode> = {
        queued: <Clock className="w-5 h-5 text-blue-400" />,
        running: <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />,
        succeeded: <CheckCircle className="w-5 h-5 text-green-400" />,
        failed: <XCircle className="w-5 h-5 text-red-400" />,
    };

    const statusLabels: Record<string, string> = {
        queued: '待機中',
        running: '実行中',
        succeeded: '完了',
        failed: '失敗',
    };

    const statusColors: Record<string, string> = {
        queued: 'bg-blue-400',
        running: 'bg-amber-400',
        succeeded: 'bg-green-400',
        failed: 'bg-red-400',
    };

    const formatDuration = (start?: string, end?: string) => {
        if (!start) return '-';
        const endTime = end ? new Date(end).getTime() : Date.now();
        const ms = endTime - new Date(start).getTime();
        const seconds = Math.round(ms / 1000);
        if (seconds < 60) return `${seconds}秒`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}分${remainingSeconds}秒`;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">レンダリング</h1>
                    <p className="text-[var(--muted)]">
                        動画レンダリングの履歴と状態
                    </p>
                </div>
                <button
                    onClick={fetchRenders}
                    className="btn btn-secondary"
                >
                    <RefreshCw className="w-4 h-4" />
                    更新
                </button>
            </div>

            {/* Active Renders */}
            {renders.some(r => r.status === 'running') && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">実行中</h2>
                    <div className="space-y-3">
                        {renders.filter(r => r.status === 'running').map((render) => (
                            <div key={render.id} className="card p-4 border-l-4 border-l-amber-400">
                                <div className="flex items-center gap-4">
                                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{render.projectName}</h3>
                                        <p className="text-sm text-[var(--muted)]">
                                            実行時間: {formatDuration(render.startedAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => fetchRenderDetail(render.id)}
                                        className="btn btn-secondary text-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        ログ
                                    </button>
                                </div>
                                {/* Progress animation */}
                                <div className="mt-3 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 animate-pulse" style={{ width: '60%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Renders List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                </div>
            ) : renders.length === 0 ? (
                <div className="text-center py-20">
                    <Film className="w-16 h-16 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">
                        レンダリング履歴がありません
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {renders.filter(r => r.status !== 'running').map((render) => (
                        <div
                            key={render.id}
                            className={`card p-4 border-l-4 ${render.status === 'succeeded' ? 'border-l-green-400' :
                                    render.status === 'failed' ? 'border-l-red-400' :
                                        'border-l-blue-400'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {statusIcons[render.status]}
                                    <div>
                                        <h3 className="font-semibold">{render.projectName}</h3>
                                        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                                            <span>{statusLabels[render.status]}</span>
                                            <span>•</span>
                                            <span>{formatDuration(render.startedAt, render.finishedAt)}</span>
                                            <span>•</span>
                                            <span>{new Date(render.createdAt).toLocaleString('ja-JP')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchRenderDetail(render.id)}
                                        className="btn btn-secondary text-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        詳細
                                    </button>
                                    {render.status === 'succeeded' && render.artifacts.length > 0 && (
                                        <a
                                            href={render.artifacts[0].uri}
                                            download
                                            className="btn btn-primary text-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                            ダウンロード
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedRender && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
                    <div className="card p-6 w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">{selectedRender.projectName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`badge ${selectedRender.status === 'succeeded' ? 'badge-success' :
                                            selectedRender.status === 'failed' ? 'badge-error' :
                                                selectedRender.status === 'running' ? 'badge-warning' : 'badge-info'
                                        }`}>
                                        {statusLabels[selectedRender.status]}
                                    </span>
                                    <span className="text-sm text-[var(--muted)]">
                                        {formatDuration(selectedRender.startedAt, selectedRender.finishedAt)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRender(null)}
                                className="p-2 rounded-lg hover:bg-[var(--card-hover)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-medium mb-2">ログ</h3>
                            <div className="h-64 overflow-auto bg-[var(--background)] rounded-lg p-3 font-mono text-sm">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : selectedRender.log ? (
                                    <pre className="whitespace-pre-wrap text-xs">
                                        {selectedRender.log}
                                    </pre>
                                ) : (
                                    <p className="text-[var(--muted)]">ログがありません</p>
                                )}
                            </div>
                        </div>

                        {selectedRender.artifacts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <h3 className="font-medium mb-2">成果物</h3>
                                <div className="space-y-2">
                                    {selectedRender.artifacts.map((artifact) => (
                                        <div key={artifact.id} className="flex items-center justify-between p-2 bg-[var(--background)] rounded-lg">
                                            <span className="text-sm">{artifact.name}</span>
                                            <a
                                                href={artifact.uri}
                                                download
                                                className="btn btn-secondary text-xs"
                                            >
                                                <Download className="w-3 h-3" />
                                                ダウンロード
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
