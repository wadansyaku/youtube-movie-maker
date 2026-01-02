'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Download,
    LayoutList,
    FileText,
    Image as ImageIcon,
    Youtube,
    Loader2,
} from 'lucide-react';
import { ProductionEpisode, EpisodeTemplate, TabType, STATUS_OPTIONS } from './types';
import { OverviewTab, ScriptTab, AssetsTab, MetadataTab } from './tabs';

interface Props {
    episode: ProductionEpisode;
    templates: EpisodeTemplate[];
}

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '概要', icon: <LayoutList size={16} /> },
    { key: 'script', label: '台本', icon: <FileText size={16} /> },
    { key: 'assets', label: '素材', icon: <ImageIcon size={16} /> },
    { key: 'metadata', label: 'メタデータ', icon: <Youtube size={16} /> },
];

export default function EpisodeDetailView({ episode, templates }: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [status, setStatus] = useState(episode.status);
    const [hookScript, setHookScript] = useState(episode.hookScript || '');
    const [ctaScript, setCtaScript] = useState(episode.ctaScript || '');
    const [ttsText, setTtsText] = useState(episode.ttsText || '');
    const [youtubeTitle, setYoutubeTitle] = useState(episode.youtubeTitle || '');
    const [youtubeDescription, setYoutubeDescription] = useState(episode.youtubeDescription || '');
    const [youtubeTags, setYoutubeTags] = useState<string[]>(episode.youtubeTags);
    const [thumbnailBrief, setThumbnailBrief] = useState(episode.thumbnailBrief || '');
    const [originalityChecks, setOriginalityChecks] = useState(episode.originalityChecks);
    const [isSaving, setIsSaving] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const laneBadge = episode.lane === 'med_bio'
        ? { label: 'Med/Bio', className: 'bg-emerald-500/20 text-emerald-400' }
        : episode.lane === 'ai_news'
            ? { label: 'AIニュース', className: 'bg-violet-500/20 text-violet-400' }
            : { label: '未分類', className: 'bg-gray-500/20 text-gray-400' };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch(`/api/production/episodes/${episode.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    hookScript,
                    ctaScript,
                    ttsText,
                    youtubeTitle,
                    youtubeDescription,
                    youtubeTags,
                    thumbnailBrief,
                    originalityChecks,
                }),
            });
            router.refresh();
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async (format: string) => {
        try {
            const res = await fetch('/api/production/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    episodeId: episode.id,
                    format,
                }),
            });

            const data = await res.json();
            if (data.content) {
                const blob = new Blob([data.content], { type: data.mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
        setShowExportMenu(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        try {
            await fetch(`/api/production/episodes/${episode.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            router.refresh();
        } catch (error) {
            console.error('Status update failed:', error);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                    <Link
                        href="/production"
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm">制作管理に戻る</span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h1 className="text-xl md:text-2xl font-bold">{episode.title}</h1>
                        <span className={`px-2 py-1 rounded text-xs ${episode.variant === 'shorts' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {episode.variant === 'shorts' ? 'Shorts' : '長尺'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${laneBadge.className}`}>
                            {laneBadge.label}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">エクスポート</span>
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                                <button onClick={() => handleExport('script')} className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm">📝 台本.txt</button>
                                <button onClick={() => handleExport('tts')} className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm">🎙️ TTS用.txt</button>
                                <button onClick={() => handleExport('capcut')} className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm">✂️ CapCutメモ.md</button>
                                <button onClick={() => handleExport('youtube_description')} className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm">📺 説明文.txt</button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span className="hidden sm:inline">{isSaving ? '保存中...' : '保存'}</span>
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-1 md:gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.key}
                        onClick={() => handleStatusChange(opt.key)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${status === opt.key
                            ? `${opt.color} text-white`
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 mb-6 bg-gray-800/50 rounded-lg p-1 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'overview' && (
                    <OverviewTab
                        episode={episode}
                        templates={templates}
                        status={status}
                        onStatusChange={handleStatusChange}
                    />
                )}
                {activeTab === 'script' && (
                    <ScriptTab
                        episode={episode}
                        hookScript={hookScript}
                        setHookScript={setHookScript}
                        ctaScript={ctaScript}
                        setCtaScript={setCtaScript}
                        ttsText={ttsText}
                        setTtsText={setTtsText}
                        originalityChecks={originalityChecks}
                        setOriginalityChecks={setOriginalityChecks}
                    />
                )}
                {activeTab === 'assets' && (
                    <AssetsTab episode={episode} />
                )}
                {activeTab === 'metadata' && (
                    <MetadataTab
                        episode={episode}
                        youtubeTitle={youtubeTitle}
                        setYoutubeTitle={setYoutubeTitle}
                        youtubeDescription={youtubeDescription}
                        setYoutubeDescription={setYoutubeDescription}
                        youtubeTags={youtubeTags}
                        setYoutubeTags={setYoutubeTags}
                        thumbnailBrief={thumbnailBrief}
                        setThumbnailBrief={setThumbnailBrief}
                    />
                )}
            </div>
        </div>
    );
}
