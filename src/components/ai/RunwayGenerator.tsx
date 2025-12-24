'use client';

import { useState, useEffect } from 'react';
import { Video, Loader2, AlertCircle, CheckCircle, Clock, Download, X } from 'lucide-react';

interface RunwayGeneratorProps {
    prompt: string;
    onComplete?: (videoUrl: string) => void;
    aspectRatio?: '16:9' | '9:16' | '1:1';
}

interface GenerationStatus {
    taskId: string;
    status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    progress: number;
    output?: string[];
    failure?: string;
    estimatedTimeRemaining?: number;
}

export default function RunwayGenerator({ prompt, onComplete, aspectRatio = '16:9' }: RunwayGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<GenerationStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState<'gen3a_turbo' | 'gen3'>('gen3a_turbo');
    const [duration, setDuration] = useState<5 | 10>(10);

    // Poll for status updates
    useEffect(() => {
        if (!status?.taskId || status.status === 'SUCCEEDED' || status.status === 'FAILED') {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/runway/status/${status.taskId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);

                    if (data.status === 'SUCCEEDED' && data.output?.[0]) {
                        onComplete?.(data.output[0]);
                        setIsGenerating(false);
                    } else if (data.status === 'FAILED') {
                        setError(data.failure || 'Generation failed');
                        setIsGenerating(false);
                    }
                }
            } catch (err) {
                console.error('Failed to poll status:', err);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [status?.taskId, status?.status, onComplete]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('プロンプトを入力してください');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setStatus(null);

        try {
            const res = await fetch('/api/runway/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptText: prompt,
                    model,
                    duration,
                    ratio: aspectRatio,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Generation failed');
            }

            const data = await res.json();
            setStatus({
                taskId: data.taskId,
                status: data.status,
                progress: 0,
            });
        } catch (err) {
            console.error('Runway generation failed:', err);
            setError(err instanceof Error ? err.message : 'Generation failed');
            setIsGenerating(false);
        }
    };

    const handleCancel = async () => {
        if (!status?.taskId) return;

        try {
            await fetch(`/api/runway/status/${status.taskId}`, {
                method: 'DELETE',
            });
            setIsGenerating(false);
            setStatus(null);
        } catch (err) {
            console.error('Failed to cancel:', err);
        }
    };

    const formatTime = (seconds?: number) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const estimateCost = () => {
        const creditsPerSecond = model === 'gen3a_turbo' ? 5 : 10;
        const credits = duration * creditsPerSecond;
        const usd = credits / 100;
        return { credits, usd: usd.toFixed(2) };
    };

    const cost = estimateCost();

    return (
        <div className="space-y-4">
            {/* Options */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Model</label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value as 'gen3a_turbo' | 'gen3')}
                        disabled={isGenerating}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white disabled:opacity-50"
                    >
                        <option value="gen3a_turbo">Gen-3 Alpha Turbo (速い)</option>
                        <option value="gen3">Gen-3 (高品質)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Duration</label>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value) as 5 | 10)}
                        disabled={isGenerating}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white disabled:opacity-50"
                    >
                        <option value={5}>5秒</option>
                        <option value={10}>10秒</option>
                    </select>
                </div>
            </div>

            {/* Cost Estimate */}
            <div className="text-xs text-gray-500">
                推定コスト: {cost.credits} credits (${cost.usd})
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        生成中...
                    </>
                ) : (
                    <>
                        <Video size={16} />
                        Runwayで生成
                    </>
                )}
            </button>

            {/* Status Display */}
            {status && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {status.status === 'PENDING' && <Clock size={16} className="text-yellow-400" />}
                            {status.status === 'RUNNING' && <Loader2 size={16} className="text-blue-400 animate-spin" />}
                            {status.status === 'SUCCEEDED' && <CheckCircle size={16} className="text-green-400" />}
                            {status.status === 'FAILED' && <AlertCircle size={16} className="text-red-400" />}
                            <span className="text-sm font-medium text-white">
                                {status.status === 'PENDING' && 'キュー待機中...'}
                                {status.status === 'RUNNING' && '生成中...'}
                                {status.status === 'SUCCEEDED' && '完了'}
                                {status.status === 'FAILED' && '失敗'}
                            </span>
                        </div>
                        {(status.status === 'PENDING' || status.status === 'RUNNING') && (
                            <button
                                onClick={handleCancel}
                                className="p-1 text-gray-400 hover:text-white rounded"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {(status.status === 'PENDING' || status.status === 'RUNNING') && (
                        <div className="space-y-1">
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                                    style={{ width: `${status.progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{Math.round(status.progress)}%</span>
                                <span>残り {formatTime(status.estimatedTimeRemaining)}</span>
                            </div>
                        </div>
                    )}

                    {/* Output Video */}
                    {status.status === 'SUCCEEDED' && status.output?.[0] && (
                        <div className="space-y-2">
                            <video
                                src={status.output[0]}
                                controls
                                className="w-full rounded-lg"
                            />
                            <a
                                href={status.output[0]}
                                download
                                className="flex items-center justify-center gap-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                <Download size={14} />
                                ダウンロード
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
        </div>
    );
}
