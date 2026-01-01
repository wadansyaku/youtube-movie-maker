'use client';

import { CheckCircle, Circle, Play, Loader2 } from 'lucide-react';
import { useVideoEditorContext } from './VideoEditorContext';
import { formatTime } from './types';

export function TranscriptionPanel() {
    const {
        segments,
        toggleSegment,
        status,
        mode,
        handleApplyEdits,
        handleUndo,
        handleRedo,
        historyIndex,
        segmentHistory,
    } = useVideoEditorContext();

    // Only show in edit mode
    if (mode !== 'edit') return null;

    const isProcessing = status !== 'idle';
    const includedCount = segments.filter(s => s.include).length;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < segmentHistory.length - 1;

    return (
        <div className="w-full lg:w-96 flex flex-col bg-gray-900/30 rounded-xl border border-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">字幕・セグメント編集</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30"
                            title="元に戻す (⌘Z)"
                        >
                            ↩️
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30"
                            title="やり直し (⌘Y)"
                        >
                            ↪️
                        </button>
                    </div>
                </div>
                {segments.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        {includedCount}/{segments.length} セグメント選択中
                    </p>
                )}
            </div>

            {/* Segments List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[400px]">
                {segments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm">
                        <p>動画をアップロードして</p>
                        <p>文字起こしを開始してください</p>
                    </div>
                ) : (
                    segments.map((segment) => (
                        <div
                            key={segment.id}
                            onClick={() => toggleSegment(segment.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${segment.include
                                    ? 'bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-500/50'
                                    : 'bg-gray-800/30 border border-transparent hover:bg-gray-800/50 opacity-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {segment.include ? (
                                        <CheckCircle className="w-4 h-4 text-indigo-400" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white leading-relaxed">
                                        {segment.text}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTime(segment.start)} → {formatTime(segment.end)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Apply Button */}
            {segments.length > 0 && (
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleApplyEdits}
                        disabled={isProcessing || includedCount === 0}
                        className="w-full btn btn-primary flex items-center justify-center gap-2"
                    >
                        {status === 'editing' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        選択範囲を適用 ({includedCount}セグメント)
                    </button>
                </div>
            )}
        </div>
    );
}
