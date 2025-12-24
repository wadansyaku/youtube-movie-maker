'use client';

import { useState } from 'react';
import { Search, Loader2, Copy, Check, Tag, FileText, Image } from 'lucide-react';

interface SEOGeneratorProps {
    episodeTitle: string;
    synopsis: string;
    onApply?: (seo: SEOSuggestion) => void;
}

interface SEOSuggestion {
    titles: string[];
    description: string;
    tags: string[];
    thumbnailIdeas: string[];
}

export default function SEOGenerator({ episodeTitle, synopsis, onApply }: SEOGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [seo, setSeo] = useState<SEOSuggestion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<number>(0);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/generate-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    episodeTitle,
                    synopsis,
                }),
            });

            if (!res.ok) {
                throw new Error('SEO generation failed');
            }

            const data = await res.json();
            setSeo(data);
        } catch (err) {
            console.error('SEO generation failed:', err);
            setError('SEO生成に失敗しました');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleApply = () => {
        if (seo) {
            onApply?.({
                ...seo,
                titles: [seo.titles[selectedTitle]],
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Generate Button */}
            {!seo && (
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            SEO生成中...
                        </>
                    ) : (
                        <>
                            <Search size={16} />
                            AIでSEO最適化
                        </>
                    )}
                </button>
            )}

            {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Generated SEO */}
            {seo && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Title Options */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                            <FileText size={14} />
                            タイトル案
                        </label>
                        <div className="space-y-2">
                            {seo.titles.map((title, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedTitle(index)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTitle === index
                                            ? 'bg-blue-900/30 border-blue-500/50 text-white'
                                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">{title}</span>
                                        <span className="text-xs text-gray-500">{title.length}文字</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <FileText size={14} />
                                説明文
                            </span>
                            <button
                                onClick={() => copyToClipboard(seo.description, 'description')}
                                className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
                            >
                                {copiedField === 'description' ? <Check size={12} /> : <Copy size={12} />}
                                {copiedField === 'description' ? 'コピー済み' : 'コピー'}
                            </button>
                        </label>
                        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{seo.description}</p>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Tag size={14} />
                                タグ
                            </span>
                            <button
                                onClick={() => copyToClipboard(seo.tags.join(', '), 'tags')}
                                className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
                            >
                                {copiedField === 'tags' ? <Check size={12} /> : <Copy size={12} />}
                                {copiedField === 'tags' ? 'コピー済み' : 'コピー'}
                            </button>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {seo.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Thumbnail Ideas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                            <Image size={14} />
                            サムネイル案
                        </label>
                        <ul className="space-y-2">
                            {seo.thumbnailIdeas.map((idea, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    {idea}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleApply}
                            className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all"
                        >
                            この設定を適用
                        </button>
                        <button
                            onClick={() => setSeo(null)}
                            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            再生成
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
