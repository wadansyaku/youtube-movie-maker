'use client';

import { useState } from 'react';
import { Youtube, Hash, Calendar, Clock, ImageIcon, Copy, Check } from 'lucide-react';
import { ProductionEpisode } from '../types';

interface Props {
    episode: ProductionEpisode;
    youtubeTitle: string;
    setYoutubeTitle: (value: string) => void;
    youtubeDescription: string;
    setYoutubeDescription: (value: string) => void;
    youtubeTags: string[];
    setYoutubeTags: (value: string[]) => void;
    thumbnailBrief: string;
    setThumbnailBrief: (value: string) => void;
}

export function MetadataTab({
    episode,
    youtubeTitle,
    setYoutubeTitle,
    youtubeDescription,
    setYoutubeDescription,
    youtubeTags,
    setYoutubeTags,
    thumbnailBrief,
    setThumbnailBrief,
}: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleTagsChange = (value: string) => {
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        setYoutubeTags(tags);
    };

    return (
        <div className="space-y-6">
            {/* YouTube Title */}
            <Section title="YouTubeタイトル" icon={<Youtube size={18} />}>
                <div className="relative">
                    <input
                        type="text"
                        value={youtubeTitle}
                        onChange={(e) => setYoutubeTitle(e.target.value)}
                        placeholder="視聴者の興味を引くタイトル (最大100文字)"
                        className="input pr-10"
                        maxLength={100}
                    />
                    <button
                        onClick={() => copyToClipboard(youtubeTitle, 'title')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        {copiedField === 'title' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{youtubeTitle.length}/100 文字</span>
                    {youtubeTitle.length > 70 && (
                        <span className="text-yellow-400">⚠️ 検索結果で途切れる可能性</span>
                    )}
                </div>
            </Section>

            {/* YouTube Description */}
            <Section title="YouTube説明文" icon={<Youtube size={18} />}>
                <div className="relative">
                    <textarea
                        value={youtubeDescription}
                        onChange={(e) => setYoutubeDescription(e.target.value)}
                        placeholder="動画の説明、タイムスタンプ、関連リンクなど"
                        className="textarea min-h-[200px]"
                        maxLength={5000}
                    />
                    <button
                        onClick={() => copyToClipboard(youtubeDescription, 'desc')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                    >
                        {copiedField === 'desc' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{youtubeDescription.length}/5000 文字</span>
                </div>
            </Section>

            {/* YouTube Tags */}
            <Section title="YouTubeタグ" icon={<Hash size={18} />}>
                <textarea
                    value={youtubeTags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="タグをカンマ区切りで入力（例: AI, 医学, 解説）"
                    className="textarea min-h-[80px]"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                    {youtubeTags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs">
                            #{tag}
                        </span>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {youtubeTags.length} タグ / 推奨: 5-15個
                </p>
            </Section>

            {/* Thumbnail Brief */}
            <Section title="サムネイル案" icon={<ImageIcon size={18} />}>
                <textarea
                    value={thumbnailBrief}
                    onChange={(e) => setThumbnailBrief(e.target.value)}
                    placeholder="サムネイルのアイデア、テキスト、色使いなど"
                    className="textarea min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-2">
                    💡 サムネイルは視聴率に大きく影響します。明るい色、顔のアップ、3語以内のテキストが効果的
                </p>
            </Section>

            {/* Publishing Info */}
            <Section title="公開設定" icon={<Calendar size={18} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">ターゲット時間</label>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock size={14} className="text-gray-400" />
                            <span>{episode.targetDuration ? `${episode.targetDuration}分` : '未設定'}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">ターゲット視聴者</label>
                        <span className="text-sm">{episode.targetAudience || '未設定'}</span>
                    </div>
                </div>
            </Section>

            {/* Pinned Comment */}
            {episode.pinnedComment && (
                <Section title="固定コメント" icon={<Youtube size={18} />}>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{episode.pinnedComment}</p>
                </Section>
            )}
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
