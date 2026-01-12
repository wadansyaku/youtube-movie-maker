'use client';

import Link from 'next/link';
import { Image as ImageIcon, Link2, Copy, ExternalLink, Plus, Video } from 'lucide-react';
import { ProductionEpisode, GenerationPrompt, EpisodeSource } from '../types';

interface Props {
    episode: ProductionEpisode;
}

export function AssetsTab({ episode }: Props) {
    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link
                    href="/studio"
                    className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 hover:border-indigo-500/50 transition-all"
                >
                    <Video className="w-6 h-6 text-indigo-400" />
                    <span className="text-sm">制作スタジオ</span>
                </Link>
                <Link
                    href="/assets"
                    className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 hover:border-green-500/50 transition-all"
                >
                    <ImageIcon className="w-6 h-6 text-green-400" />
                    <span className="text-sm">素材ライブラリ</span>
                </Link>
                <button className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 hover:border-yellow-500/50 transition-all">
                    <Plus className="w-6 h-6 text-yellow-400" />
                    <span className="text-sm">素材追加</span>
                </button>
            </div>

            {/* Generation Prompts */}
            <Section title={`生成プロンプト (${episode.generationPrompts.length})`} icon={<ImageIcon size={18} />}>
                {episode.generationPrompts.length > 0 ? (
                    <div className="space-y-3">
                        {episode.generationPrompts.map((prompt) => (
                            <PromptCard key={prompt.id} prompt={prompt} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<ImageIcon className="w-8 h-8" />}
                        message="生成プロンプトがありません"
                    />
                )}
            </Section>

            {/* Reference Sources */}
            <Section title={`参考資料 (${episode.sources.length})`} icon={<Link2 size={18} />}>
                {episode.sources.length > 0 ? (
                    <div className="space-y-2">
                        {episode.sources.map((source) => (
                            <SourceCard key={source.id} source={source} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Link2 className="w-8 h-8" />}
                        message="参考資料がありません"
                        action={
                            <button className="text-indigo-400 hover:text-indigo-300 text-sm">
                                参考資料を追加 →
                            </button>
                        }
                    />
                )}
            </Section>
        </div>
    );
}

function PromptCard({ prompt }: { prompt: GenerationPrompt }) {
    const copyPrompt = () => {
        navigator.clipboard.writeText(prompt.promptText);
    };

    const platformColors: Record<string, string> = {
        runway: 'bg-red-500/20 text-red-400',
        midjourney: 'bg-blue-500/20 text-blue-400',
        suno: 'bg-green-500/20 text-green-400',
        openai: 'bg-purple-500/20 text-purple-400',
    };

    return (
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded ${platformColors[prompt.platform] || 'bg-gray-700 text-gray-300'}`}>
                    {prompt.platform}
                </span>
                <div className="flex items-center gap-2">
                    {prompt.resultUrl && (
                        <a
                            href={prompt.resultUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                    <button
                        onClick={copyPrompt}
                        className="text-gray-400 hover:text-white"
                        title="プロンプトをコピー"
                    >
                        <Copy size={14} />
                    </button>
                </div>
            </div>
            <p className="text-sm text-gray-300">{prompt.promptText}</p>
        </div>
    );
}

function SourceCard({ source }: { source: EpisodeSource }) {
    const typeIcons: Record<string, string> = {
        paper: '📄',
        website: '🌐',
        video: '🎬',
        book: '📚',
        interview: '🎤',
    };

    return (
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="flex items-center gap-2">
                <span className="text-lg">{typeIcons[source.type] || '📎'}</span>
                <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{source.title || source.url || '無題'}</span>
                    {source.notes && (
                        <span className="text-xs text-gray-500 line-clamp-1">{source.notes}</span>
                    )}
                </div>
                {source.url && (
                    <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white flex-shrink-0"
                    >
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <h3 className="flex items-center gap-2 font-medium mb-4 text-sm text-gray-300">
                {icon}
                {title}
            </h3>
            {children}
        </div>
    );
}

function EmptyState({ icon, message, action }: { icon: React.ReactNode; message: string; action?: React.ReactNode }) {
    return (
        <div className="text-center py-8 text-gray-500">
            <div className="flex justify-center mb-3 opacity-30">{icon}</div>
            <p className="text-sm mb-2">{message}</p>
            {action}
        </div>
    );
}
