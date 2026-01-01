'use client';

import { FileText, Play, Loader2, Download, Library, Image } from 'lucide-react';
import { useVideoEditorContext } from './VideoEditorContext';
import { API_BASE } from './types';

export function SlidesPanel() {
    const {
        mode,
        slidesSpecPath,
        setSlidesSpecPath,
        slideTemplate,
        setSlideTemplate,
        renderedSlides,
        status,
        handleRenderSlides,
        handleGenerateSlidesVideo,
        editedVideoPath,
        handleDownload,
        openSaveModal,
    } = useVideoEditorContext();

    // Only show in slides mode
    if (mode !== 'slides') return null;

    const isProcessing = status !== 'idle';

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6">
            {/* Settings Panel */}
            <div className="lg:w-80 flex flex-col gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">
                        Spec ファイルパス
                    </label>
                    <input
                        type="text"
                        value={slidesSpecPath}
                        onChange={(e) => setSlidesSpecPath(e.target.value)}
                        placeholder="slides/spec.yml"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">
                        テンプレート
                    </label>
                    <select
                        value={slideTemplate}
                        onChange={(e) => setSlideTemplate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="classic">Classic</option>
                        <option value="modern">Modern</option>
                        <option value="minimal">Minimal</option>
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-2">
                    <button
                        onClick={handleRenderSlides}
                        disabled={isProcessing || !slidesSpecPath.trim()}
                        className="btn btn-secondary flex items-center justify-center gap-2"
                    >
                        {status === 'rendering-slides' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Image className="w-4 h-4" />
                        )}
                        スライドをレンダリング
                    </button>
                    <button
                        onClick={handleGenerateSlidesVideo}
                        disabled={isProcessing || !slidesSpecPath.trim()}
                        className="btn btn-primary flex items-center justify-center gap-2"
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
                {(editedVideoPath || renderedSlides.length > 0) && (
                    <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-gray-800">
                        {editedVideoPath && (
                            <button
                                onClick={handleDownload}
                                className="btn btn-secondary flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                動画をダウンロード
                            </button>
                        )}
                        {renderedSlides.length > 0 && (
                            <button
                                onClick={() => openSaveModal('slides')}
                                className="btn btn-primary flex items-center justify-center gap-2"
                            >
                                <Library className="w-4 h-4" />
                                スライドを保存
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Slides Preview */}
            <div className="flex-1 bg-gray-900/30 rounded-xl border border-gray-800 p-4">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    レンダリングされたスライド ({renderedSlides.length}枚)
                </h3>

                {renderedSlides.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 text-sm">
                        <FileText className="w-12 h-12 mb-4 opacity-30" />
                        <p>スライドをレンダリングしてください</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
                        {renderedSlides.map((slide) => (
                            <div
                                key={slide.index}
                                className="relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-800"
                            >
                                <img
                                    src={`${API_BASE}/api/slides/serve?path=${encodeURIComponent(slide.pngPath)}`}
                                    alt={slide.title}
                                    className="w-full h-auto"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xs text-white truncate">{slide.title}</p>
                                    <p className="text-xs text-gray-400">{slide.durationSec}秒</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
