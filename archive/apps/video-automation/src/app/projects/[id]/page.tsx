'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Play, Film, Settings, History, Maximize2, Minimize2, X } from 'lucide-react';
import { toast } from 'sonner';
import { RemotionPreview } from '@/components/player/RemotionPreview';
import { JsonConfigEditor } from '@/components/editor/JsonConfigEditor';
import { VideoConfig } from '@/remotion/types/video';

interface Project {
    id: string;
    title: string;
    status: string;
    videoConfig: VideoConfig | null;
    template: { id: string; name: string } | null;
    jobRuns: Array<{
        id: string;
        status: string;
        startedAt?: string;
        finishedAt?: string;
        createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

const defaultVideoConfig: VideoConfig = {
    title: '新規ショート動画',
    themeLabel: '医学メモ',
    themeId: 'medical-dark',
    duration: 60,
    sections: [
        {
            type: 'hook',
            startSec: 0,
            endSec: 5,
            onScreenText: 'このショート動画で学ぶこと',
        },
        {
            type: 'keypoint',
            startSec: 5,
            endSec: 25,
            onScreenText: 'ポイント1',
        },
        {
            type: 'conclusion',
            startSec: 25,
            endSec: 60,
            onScreenText: 'まとめ',
        },
    ],
    disclaimer: 'この動画は教育目的です',
};

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [videoConfig, setVideoConfig] = useState<VideoConfig>(defaultVideoConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
    const [hasChanges, setHasChanges] = useState(false);
    const [previewSize, setPreviewSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasChanges && !isSaving) {
                    handleSave();
                }
            }
            // F to toggle fullscreen preview
            if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Only if not typing in input/textarea
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
                    e.preventDefault();
                    setIsFullscreen(prev => !prev);
                }
            }
            // Escape to close fullscreen or go back
            if (e.key === 'Escape') {
                if (isFullscreen) {
                    setIsFullscreen(false);
                } else {
                    router.push('/projects');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, isSaving, router, isFullscreen]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data);
                if (data.videoConfig) {
                    setVideoConfig(data.videoConfig);
                }
            } else {
                toast.error('プロジェクトが見つかりません');
                router.push('/projects');
            }
        } catch (error) {
            console.error('Failed to fetch project:', error);
            toast.error('読み込みエラー');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigChange = useCallback((newConfig: VideoConfig) => {
        setVideoConfig(newConfig);
        setHasChanges(true);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoConfig }),
            });

            if (res.ok) {
                toast.success('保存しました ✓', {
                    description: 'Ctrl+S でいつでも保存できます',
                });
                setHasChanges(false);
            } else {
                toast.error('保存に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('保存エラー');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartRender = async () => {
        if (hasChanges) {
            await handleSave();
        }

        setIsRendering(true);
        try {
            const res = await fetch('/api/renders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    videoConfig,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('レンダリングを開始しました');
                router.push(`/renders?highlight=${data.id}`);
            } else {
                toast.error('レンダリング開始に失敗しました');
            }
        } catch (error) {
            console.error('Failed to start render:', error);
            toast.error('レンダリングエラー');
        } finally {
            setIsRendering(false);
        }
    };

    const cyclePreviewSize = () => {
        setPreviewSize((current) => {
            if (current === 'sm') return 'md';
            if (current === 'md') return 'lg';
            return 'sm';
        });
    };

    const previewMaxWidths = {
        sm: 'max-w-xs',
        md: 'max-w-sm',
        lg: 'max-w-md',
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="h-full flex flex-col">
            {/* Fullscreen Preview Modal */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fadeIn"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
                        title="閉じる (Esc)"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <div
                        className="w-full max-w-lg animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <RemotionPreview
                            compositionId="MedicalShorts"
                            props={videoConfig}
                        />
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                        <kbd className="px-2 py-1 bg-white/10 rounded mr-2">Esc</kbd> 閉じる
                        <span className="ml-6"><kbd className="px-2 py-1 bg-white/10 rounded mr-2">F</kbd> フルスクリーン切替</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--card)]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/projects')}
                        className="p-2 rounded-lg hover:bg-[var(--card-hover)] transition"
                        title="戻る (Esc)"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{project.title}</h1>
                        <p className="text-sm text-[var(--muted)]">
                            最終更新: {new Date(project.updatedAt).toLocaleString('ja-JP')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <span className="text-xs text-amber-400 mr-2 animate-pulse">
                                ● 未保存
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="btn btn-secondary disabled:opacity-50"
                            title="保存 (Ctrl+S)"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button
                            onClick={handleStartRender}
                            disabled={isRendering}
                            className="btn btn-primary"
                        >
                            <Play className="w-4 h-4" />
                            {isRendering ? '開始中...' : 'レンダリング開始'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Editor */}
                <div className="w-1/2 border-r border-[var(--border)] overflow-y-auto">
                    <div className="p-4">
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'editor'
                                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]'
                                    : 'bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)]'
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                エディタ
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'history'
                                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]'
                                    : 'bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)]'
                                    }`}
                            >
                                <History className="w-4 h-4" />
                                履歴
                            </button>
                        </div>

                        {activeTab === 'editor' ? (
                            <JsonConfigEditor
                                config={videoConfig}
                                onChange={handleConfigChange}
                            />
                        ) : (
                            <div className="space-y-2">
                                {project.jobRuns.length === 0 ? (
                                    <p className="text-[var(--muted)] text-center py-8">
                                        レンダリング履歴がありません
                                    </p>
                                ) : (
                                    project.jobRuns.map((run) => (
                                        <div key={run.id} className="card p-4">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`badge ${run.status === 'succeeded'
                                                        ? 'badge-success'
                                                        : run.status === 'failed'
                                                            ? 'badge-error'
                                                            : run.status === 'running'
                                                                ? 'badge-warning'
                                                                : 'badge-info'
                                                        }`}
                                                >
                                                    {run.status}
                                                </span>
                                                <span className="text-sm text-[var(--muted)]">
                                                    {new Date(run.createdAt).toLocaleString('ja-JP')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="w-1/2 overflow-y-auto bg-[var(--background)]">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Film className="w-5 h-5" />
                                <h2 className="font-semibold">プレビュー</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={cyclePreviewSize}
                                    className="btn btn-secondary text-sm"
                                    title="プレビューサイズ変更"
                                >
                                    {previewSize === 'lg' ? (
                                        <Minimize2 className="w-4 h-4" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4" />
                                    )}
                                    {previewSize.toUpperCase()}
                                </button>
                                <button
                                    onClick={() => setIsFullscreen(true)}
                                    className="btn btn-primary text-sm"
                                    title="フルスクリーン (F)"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                    フルスクリーン
                                </button>
                            </div>
                        </div>
                        <div className={`${previewMaxWidths[previewSize]} mx-auto transition-all duration-300`}>
                            <RemotionPreview
                                compositionId="MedicalShorts"
                                props={videoConfig}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="p-2 border-t border-[var(--border)] bg-[var(--card)] text-xs text-[var(--muted)] flex gap-4 justify-center">
                <span><kbd className="px-1 py-0.5 bg-[var(--background)] rounded">Ctrl+S</kbd> 保存</span>
                <span><kbd className="px-1 py-0.5 bg-[var(--background)] rounded">F</kbd> フルスクリーン</span>
                <span><kbd className="px-1 py-0.5 bg-[var(--background)] rounded">Esc</kbd> 戻る</span>
            </div>
        </div>
    );
}
