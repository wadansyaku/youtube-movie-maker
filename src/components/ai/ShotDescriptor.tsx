'use client';

import { useState } from 'react';
import { Film, Loader2, Check, Copy, Video } from 'lucide-react';

interface ShotDescriptorProps {
    sceneDescription: string;
    seriesId?: string;
    onShotsGenerated?: (shots: ShotBreakdown[]) => void;
}

interface ShotBreakdown {
    name: string;
    description: string;
    cameraMovement: string;
    duration: number;
    promptSuggestion: string;
}

export default function ShotDescriptor({ sceneDescription, seriesId, onShotsGenerated }: ShotDescriptorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [shots, setShots] = useState<ShotBreakdown[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!sceneDescription.trim()) {
            setError('シーン説明を入力してください');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/describe-shots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sceneDescription,
                    seriesId,
                }),
            });

            if (!res.ok) {
                throw new Error('Shot description failed');
            }

            const data = await res.json();
            setShots(data.shots || []);
            onShotsGenerated?.(data.shots || []);
        } catch (err) {
            console.error('Shot description failed:', err);
            setError('ショット分解に失敗しました');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyPrompt = async (prompt: string, index: number) => {
        await navigator.clipboard.writeText(prompt);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const formatDuration = (seconds: number) => {
        return `${seconds}s`;
    };

    const getCameraIcon = (movement: string) => {
        const lowerMovement = movement.toLowerCase();
        if (lowerMovement.includes('pan')) return '↔️';
        if (lowerMovement.includes('tilt')) return '↕️';
        if (lowerMovement.includes('dolly') || lowerMovement.includes('zoom')) return '🔎';
        if (lowerMovement.includes('tracking')) return '🎯';
        return '📷';
    };

    return (
        <div className="space-y-4">
            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !sceneDescription.trim()}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        ショット分解中...
                    </>
                ) : (
                    <>
                        <Film size={16} />
                        AIでショット分解
                    </>
                )}
            </button>

            {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Generated Shots */}
            {shots.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            ショット構成 ({shots.length}カット)
                        </h4>
                        <span className="text-xs text-gray-500">
                            合計: {shots.reduce((sum, s) => sum + s.duration, 0)}秒
                        </span>
                    </div>

                    {shots.map((shot, index) => (
                        <div
                            key={index}
                            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-orange-500/30 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-orange-900/30 text-orange-400 text-xs font-mono rounded">
                                        {shot.name}
                                    </span>
                                    <span className="text-gray-500">{getCameraIcon(shot.cameraMovement)}</span>
                                    <span className="text-xs text-gray-500">{shot.cameraMovement}</span>
                                </div>
                                <span className="text-xs text-gray-500">{formatDuration(shot.duration)}</span>
                            </div>

                            <p className="text-sm text-gray-300 mb-3">{shot.description}</p>

                            {/* Prompt Suggestion */}
                            <div className="p-3 bg-black/30 rounded-lg border border-gray-700/50">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Video size={12} className="text-orange-400" />
                                            <span className="text-xs text-orange-400">Prompt Suggestion</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">{shot.promptSuggestion}</p>
                                    </div>
                                    <button
                                        onClick={() => copyPrompt(shot.promptSuggestion, index)}
                                        className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        {copiedIndex === index ? (
                                            <Check size={12} className="text-green-400" />
                                        ) : (
                                            <Copy size={12} className="text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
