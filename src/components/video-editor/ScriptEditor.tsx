'use client';

import { Sparkles, Play, Loader2, Download, Library } from 'lucide-react';
import { useVideoEditorContext } from './VideoEditorContext';

export function ScriptEditor() {
    const {
        mode,
        script,
        setScript,
        language,
        setLanguage,
        status,
        handleGenerate,
        handleImproveScript,
        showImprovePreview,
        improvedScript,
        improveChanges,
        applyImprovedScript,
        revertScript,
        editedVideoPath,
        handleDownload,
        openSaveModal,
    } = useVideoEditorContext();

    // Only show in generate mode
    if (mode !== 'generate') return null;

    const isProcessing = status !== 'idle';

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6">
            {/* Script Input */}
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">台本入力</h3>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                        <option value="ja">日本語</option>
                        <option value="en">English</option>
                    </select>
                </div>

                <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="ここに台本を入力してください..."
                    className="flex-1 min-h-[300px] bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-sm resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={handleImproveScript}
                        disabled={isProcessing || !script.trim()}
                        className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                    >
                        {status === 'improving' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        AIで改善
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isProcessing || !script.trim()}
                        className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                    >
                        {status === 'generating' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        動画を生成
                    </button>
                </div>

                {/* Export Buttons */}
                {editedVideoPath && (
                    <div className="flex gap-3 mt-3">
                        <button
                            onClick={handleDownload}
                            className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            ダウンロード
                        </button>
                        <button
                            onClick={() => openSaveModal('video')}
                            className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                        >
                            <Library className="w-4 h-4" />
                            ライブラリに保存
                        </button>
                    </div>
                )}
            </div>

            {/* AI Improvement Preview */}
            {showImprovePreview && (
                <div className="flex-1 flex flex-col bg-gray-900/30 rounded-xl border border-indigo-500/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            AI改善プレビュー
                        </h3>
                    </div>

                    {/* Changes */}
                    {improveChanges.length > 0 && (
                        <div className="mb-3 p-3 bg-indigo-500/10 rounded-lg">
                            <p className="text-xs text-indigo-300 font-medium mb-2">変更点:</p>
                            <ul className="text-xs text-gray-300 space-y-1">
                                {improveChanges.map((change, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-indigo-400">•</span>
                                        {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Improved Script */}
                    <div className="flex-1 overflow-y-auto bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap">
                        {improvedScript}
                    </div>

                    {/* Apply/Revert Buttons */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={revertScript}
                            className="flex-1 btn btn-secondary"
                        >
                            元に戻す
                        </button>
                        <button
                            onClick={applyImprovedScript}
                            className="flex-1 btn btn-primary"
                        >
                            適用する
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
