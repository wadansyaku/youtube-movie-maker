'use client';

import React, { useState, useCallback } from 'react';
import { Player } from '@remotion/player';
import { MedicalShorts } from '@/remotion/MedicalShorts';
import { VideoConfig } from '@/remotion/types/video';
import { Upload, Play, FileText, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateAssetInstructions } from '@/app/automation/actions';

interface QuickPreviewProps {
    onConfigLoad?: (config: VideoConfig) => void;
}

export default function QuickPreview({ onConfigLoad }: QuickPreviewProps) {
    const [config, setConfig] = useState<VideoConfig | null>(null);
    const [jsonText, setJsonText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLoadConfig = useCallback((text: string) => {
        try {
            const parsed = JSON.parse(text);
            if (!parsed.title || !parsed.sections) {
                throw new Error('Invalid config: missing title or sections');
            }
            setConfig(parsed);
            setJsonText(text);
            setError(null);
            onConfigLoad?.(parsed);
            toast.success(`読み込み完了: ${parsed.title}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : '無効なJSON');
            toast.error('ファイルの読み込みに失敗しました');
        }
    }, [onConfigLoad]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handleLoadConfig(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleGeneratePrompts = async () => {
        if (!jsonText) return;
        setIsGenerating(true);
        try {
            const result = await generateAssetInstructions(jsonText);
            const blob = new Blob([result], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${config?.title || 'video'}_PROMPTS.md`;
            a.click();
            toast.success('プロンプト生成完了！');
        } catch (err) {
            toast.error('プロンプト生成に失敗しました');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900/70 to-gray-950 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                    <Play className="h-5 w-5 text-purple-200" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">クイックプレビュー</h2>
                    <p className="text-xs text-gray-400">レシピファイルをアップロードして確認</p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Left: Input */}
                <div className="space-y-3">
                    <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-700 bg-gray-900/50 px-4 py-6 cursor-pointer hover:border-purple-500/60 transition-colors">
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-400">レシピファイルをドロップまたはクリック</span>
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>

                    <textarea
                        value={jsonText}
                        onChange={(e) => {
                            setJsonText(e.target.value);
                            if (e.target.value.trim()) {
                                handleLoadConfig(e.target.value);
                            }
                        }}
                        placeholder='{"title": "...", "sections": [...]}'
                        className="w-full h-32 bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs font-mono text-gray-300 placeholder-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {config && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleGeneratePrompts}
                                disabled={isGenerating}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600/20 border border-emerald-600/50 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                            >
                                <FileText className="h-4 w-4" />
                                {isGenerating ? '生成中...' : 'AIプロンプト生成'}
                            </button>
                            <a
                                href={`data:application/json;charset=utf-8,${encodeURIComponent(jsonText)}`}
                                download={`${config.title}.json`}
                                className="flex items-center justify-center gap-2 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Right: Preview */}
                <div className="flex items-center justify-center bg-black rounded-xl overflow-hidden min-h-[300px]">
                    {config ? (
                        <Player
                            component={MedicalShorts as any}
                            inputProps={config as any}
                            durationInFrames={Math.round((config.duration || 60) * 30)}
                            fps={30}
                            compositionWidth={1080}
                            compositionHeight={1920}
                            style={{
                                width: 169,
                                height: 300,
                            }}
                            controls
                            loop
                        />
                    ) : (
                        <div className="text-center text-gray-500 text-sm">
                            <Play className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            レシピを読み込むとプレビュー表示
                        </div>
                    )}
                </div>
            </div>

            {/* Config Info */}
            {config && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
                        {config.title}
                    </span>
                    <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                        {config.duration}秒
                    </span>
                    <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                        {config.sections.length}セクション
                    </span>
                    {config.themeId && (
                        <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                            {config.themeId}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
