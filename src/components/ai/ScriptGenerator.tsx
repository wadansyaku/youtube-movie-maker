'use client';

import { useState } from 'react';
import { Sparkles, Loader2, FileText, Clock, Film } from 'lucide-react';

interface ScriptGeneratorProps {
    seriesId: string;
    onScriptGenerated?: (script: ScriptSuggestion) => void;
    onCreateEpisode?: (title: string, synopsis: string) => void;
}

interface ScriptSuggestion {
    title: string;
    synopsis: string;
    scenes: {
        name: string;
        description: string;
        estimatedDuration: number;
    }[];
    estimatedTotalDuration: number;
}

export default function ScriptGenerator({ seriesId, onScriptGenerated, onCreateEpisode }: ScriptGeneratorProps) {
    const [concept, setConcept] = useState('');
    const [targetDuration, setTargetDuration] = useState(180);
    const [isGenerating, setIsGenerating] = useState(false);
    const [script, setScript] = useState<ScriptSuggestion | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!concept.trim()) {
            setError('コンセプトを入力してください');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setScript(null);

        try {
            const res = await fetch('/api/ai/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seriesId,
                    concept,
                    targetDuration,
                }),
            });

            if (!res.ok) {
                throw new Error('Script generation failed');
            }

            const data = await res.json();
            setScript(data);
            onScriptGenerated?.(data);
        } catch (err) {
            console.error('Script generation failed:', err);
            setError('スクリプト生成に失敗しました。API Keyが設定されているか確認してください。');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateEpisode = () => {
        if (script) {
            onCreateEpisode?.(script.title, script.synopsis);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        エピソードのコンセプト
                    </label>
                    <textarea
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="例: サイバーパンクな東京で繰り広げられる猫と人間の不思議な友情物語..."
                        className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-purple-500/50 outline-none resize-none"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            目標尺（秒）
                        </label>
                        <select
                            value={targetDuration}
                            onChange={(e) => setTargetDuration(Number(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        >
                            <option value={60}>1分 (Shorts)</option>
                            <option value={180}>3分</option>
                            <option value={300}>5分</option>
                            <option value={600}>10分</option>
                            <option value={900}>15分</option>
                        </select>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !concept.trim()}
                        className="mt-7 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                AI Generate
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Generated Script */}
            {script && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{script.title}</h3>
                                <p className="text-sm text-gray-400">{script.synopsis}</p>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-purple-400">
                                <Clock size={14} />
                                {formatDuration(script.estimatedTotalDuration)}
                            </div>
                        </div>
                    </div>

                    {/* Scenes */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Film size={14} />
                            シーン構成
                        </h4>
                        {script.scenes.map((scene, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-sm font-bold text-white">
                                        Scene {index + 1}: {scene.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatDuration(scene.estimatedDuration)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400">{scene.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreateEpisode}
                            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <FileText size={16} />
                            このスクリプトでエピソード作成
                        </button>
                        <button
                            onClick={() => setScript(null)}
                            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                        >
                            やり直す
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
