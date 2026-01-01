'use client';

import { useEffect, useRef } from 'react';
import { Scissors, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { useVideoEditor } from '@/hooks/useVideoEditor';
import {
    VideoEditorProvider,
    EditorToolbar,
    VideoPreview,
    TranscriptionPanel,
    ScriptEditor,
    SlidesPanel,
    SaveToLibraryModal,
} from '@/components/video-editor';

function VideoEditorContent() {
    const editor = useVideoEditor();
    const videoRef = useRef<HTMLVideoElement>(null);

    const {
        apiOnline,
        checkApiStatus,
        status,
        progress,
        error,
        successMessage,
        setError,
        setSuccessMessage,
        mode,
        segments,
        handleUndo,
        handleRedo,
        pushToHistory,
        setSegments,
        editedVideoPath,
        openSaveModal,
    } = editor;

    const isProcessing = status !== 'idle';

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            // Space: Play/Pause video
            if (e.code === 'Space' && videoRef.current) {
                e.preventDefault();
                if (videoRef.current.paused) {
                    videoRef.current.play();
                } else {
                    videoRef.current.pause();
                }
            }

            // Delete: Remove unchecked segments
            if (e.code === 'Delete' || e.code === 'Backspace') {
                if (segments.length > 0 && mode === 'edit') {
                    const newSegments = segments.filter(s => s.include);
                    if (newSegments.length !== segments.length) {
                        pushToHistory(newSegments);
                        setSegments(newSegments);
                    }
                }
            }

            // Ctrl+A: Select all
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
                e.preventDefault();
                if (segments.length > 0) {
                    const allSelected = segments.map(s => ({ ...s, include: true }));
                    pushToHistory(allSelected);
                    setSegments(allSelected);
                }
            }

            // Ctrl+Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }

            // Ctrl+Shift+Z or Ctrl+Y: Redo
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.shiftKey && e.code === 'KeyZ'))) {
                e.preventDefault();
                handleRedo();
            }

            // Ctrl+S: Save
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
                e.preventDefault();
                if (editedVideoPath) {
                    openSaveModal(mode === 'slides' ? 'slides' : 'video');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [segments, mode, editedVideoPath, handleUndo, handleRedo, pushToHistory, setSegments, openSaveModal]);

    return (
        <VideoEditorProvider value={editor}>
            <div className="min-h-screen bg-gray-950 text-white p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">動画エディタ</h1>
                            <p className="text-gray-400 text-sm">AI文字起こし＆テキストベース編集</p>
                        </div>
                    </div>

                    {/* API Status */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
                            {apiOnline === null ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            ) : apiOnline ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-green-400">API Online</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-red-400">API Offline</span>
                                </>
                            )}
                        </div>
                        {apiOnline === false && (
                            <button
                                onClick={checkApiStatus}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                再接続
                            </button>
                        )}
                    </div>
                </div>

                {/* API Offline Warning */}
                {apiOnline === false && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-red-400">APIサーバーが起動していません</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                以下のコマンドでAPIサーバーを起動してください:
                            </p>
                            <code className="block mt-2 px-3 py-2 bg-gray-800 rounded text-sm font-mono text-gray-300">
                                npm run dev:api
                            </code>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {isProcessing && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">
                                {status === 'uploading' && 'アップロード中...'}
                                {status === 'transcribing' && '文字起こし中...'}
                                {status === 'editing' && '編集を適用中...'}
                                {status === 'generating' && '動画を生成中...'}
                                {status === 'rendering-slides' && 'スライドをレンダリング中...'}
                                {status === 'removing-silence' && '無音を削除中...'}
                                {status === 'saving' && '保存中...'}
                                {status === 'improving' && 'AIが改善中...'}
                            </span>
                            <span className="text-sm text-gray-400">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400">{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage(null)} className="text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Mode Toolbar */}
                <EditorToolbar />

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Edit Mode */}
                    <VideoPreview />
                    <TranscriptionPanel />

                    {/* Generate Mode */}
                    <ScriptEditor />

                    {/* Slides Mode */}
                    <SlidesPanel />
                </div>

                {/* Save Modal */}
                <SaveToLibraryModal />
            </div>
        </VideoEditorProvider>
    );
}

export default function VideoEditorPage() {
    return <VideoEditorContent />;
}
