'use client';

import { useState } from 'react';
import { ImageIcon, Loader2, Download, RefreshCw } from 'lucide-react';

interface ThumbnailGeneratorProps {
    title?: string;
    description?: string;
    onGenerated?: (imageBase64: string) => void;
}

const STYLE_PRESETS = [
    { id: 'cinematic', label: 'Cinematic', value: 'cinematic dramatic lighting, movie poster style' },
    { id: 'anime', label: 'Anime', value: 'anime style, vibrant colors, manga inspired' },
    { id: 'realistic', label: 'Realistic', value: 'photorealistic, high detail, professional photography' },
    { id: 'fantasy', label: 'Fantasy', value: 'fantasy art, magical, ethereal lighting' },
    { id: 'scifi', label: 'Sci-Fi', value: 'science fiction, futuristic, neon cyberpunk' },
    { id: 'minimalist', label: 'Minimalist', value: 'minimalist design, clean, modern' },
];

export default function ThumbnailGenerator({
    title: initialTitle = '',
    description: initialDescription = '',
    onGenerated
}: ThumbnailGeneratorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [style, setStyle] = useState(STYLE_PRESETS[0].value);
    const [isGenerating, setIsGenerating] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!title.trim()) {
            setError('タイトルを入力してください');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/stability/thumbnail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    style,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Generation failed');
            }

            const data = await res.json();

            // Convert base64 to data URL
            const url = `data:image/png;base64,${data.image}`;
            setImageUrl(url);
            onGenerated?.(data.image);
        } catch (err) {
            console.error('Thumbnail generation failed:', err);
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;

        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `thumbnail_${Date.now()}.png`;
        a.click();
    };

    return (
        <div className="space-y-4">
            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    動画タイトル
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 【衝撃】宇宙の謎を解明..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    説明（オプション）
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="サムネイルに反映したい要素..."
                    className="w-full h-20 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                />
            </div>

            {/* Style Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    スタイル
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {STYLE_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => setStyle(preset.value)}
                            className={`px-3 py-2 rounded-lg text-sm transition-all ${style === preset.value
                                    ? 'bg-pink-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !title.trim()}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        生成中（約30秒）...
                    </>
                ) : (
                    <>
                        <ImageIcon size={16} />
                        サムネイル生成
                    </>
                )}
            </button>

            {/* Generated Image */}
            {imageUrl && (
                <div className="space-y-3">
                    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
                        <img
                            src={imageUrl}
                            alt="Generated thumbnail"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2"
                        >
                            <Download size={14} />
                            ダウンロード
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
