'use client';

import { useRef, useCallback } from 'react';
import { Upload, Play, Pause, Wand2, VolumeX, Download, Library, Loader2 } from 'lucide-react';
import { useVideoEditorContext } from './VideoEditorContext';
import { API_BASE } from './types';

export function VideoPreview() {
    const {
        videoInfo,
        editedVideoPath,
        status,
        mode,
        handleFileUpload,
        handleTranscribe,
        handleRemoveSilence,
        handleDownload,
        openSaveModal,
    } = useVideoEditorContext();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    }, [handleFileUpload]);

    const isProcessing = status !== 'idle';
    const videoSrc = editedVideoPath
        ? `${API_BASE}/api/video/serve?path=${encodeURIComponent(editedVideoPath)}`
        : videoInfo?.video_path
            ? `${API_BASE}/api/video/serve?path=${encodeURIComponent(videoInfo.video_path)}`
            : null;

    // Only show in edit mode
    if (mode !== 'edit') return null;

    return (
        <div className="flex-1 flex flex-col">
            {/* Video Display Area */}
            <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                {videoSrc ? (
                    <div className="flex-1 flex items-center justify-center bg-black">
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            controls
                            className="max-w-full max-h-full"
                        />
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800/30 transition-colors p-8"
                    >
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">
                            クリックして動画をアップロード
                        </h3>
                        <p className="text-sm text-gray-400">
                            MP4, MOV, AVI, MKV に対応
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Action Buttons */}
            {videoInfo && (
                <div className="flex flex-wrap gap-3 mt-4">
                    <button
                        onClick={handleTranscribe}
                        disabled={isProcessing}
                        className="flex-1 min-w-0 btn btn-primary flex items-center justify-center gap-2"
                    >
                        {status === 'transcribing' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Wand2 className="w-4 h-4" />
                        )}
                        <span className="truncate">文字起こし開始</span>
                    </button>
                    <button
                        onClick={handleRemoveSilence}
                        disabled={isProcessing}
                        className="flex-1 min-w-0 btn btn-secondary flex items-center justify-center gap-2"
                    >
                        {status === 'removing-silence' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <VolumeX className="w-4 h-4" />
                        )}
                        <span className="truncate">無音削除</span>
                    </button>
                </div>
            )}

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

            {/* Video Info */}
            {videoInfo && (
                <div className="mt-4 text-xs text-gray-500 flex flex-wrap gap-4">
                    <span>📁 {videoInfo.filename}</span>
                    <span>⏱ {videoInfo.duration.toFixed(1)}秒</span>
                    <span>📐 {videoInfo.size[0]}x{videoInfo.size[1]}</span>
                    <span>🎞 {videoInfo.fps}fps</span>
                </div>
            )}
        </div>
    );
}
