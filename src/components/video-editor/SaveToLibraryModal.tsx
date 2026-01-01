'use client';

import { X, Loader2, FolderPlus } from 'lucide-react';
import { useVideoEditorContext } from './VideoEditorContext';

export function SaveToLibraryModal() {
    const {
        showSaveModal,
        setShowSaveModal,
        saveTarget,
        saveFileName,
        setSaveFileName,
        projects,
        selectedProjectId,
        setSelectedProjectId,
        scenes,
        selectedSceneId,
        setSelectedSceneId,
        shots,
        selectedShotId,
        setSelectedShotId,
        saveToShot,
        setSaveToShot,
        status,
        handleSaveToLibrary,
    } = useVideoEditorContext();

    if (!showSaveModal) return null;

    const isProcessing = status === 'saving';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-indigo-400" />
                        {saveTarget === 'slides' ? 'スライドを保存' : 'ライブラリに保存'}
                    </h2>
                    <button
                        onClick={() => setShowSaveModal(false)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* File Name */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            ファイル名
                        </label>
                        <input
                            type="text"
                            value={saveFileName}
                            onChange={(e) => setSaveFileName(e.target.value)}
                            placeholder="output.mp4"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Project Selection */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            プロジェクトにリンク (任意)
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">リンクしない</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Scene/Shot Selection (if project selected) */}
                    {selectedProjectId && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    シーン (任意)
                                </label>
                                <select
                                    value={selectedSceneId}
                                    onChange={(e) => setSelectedSceneId(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">選択しない</option>
                                    {scenes.map((scene) => (
                                        <option key={scene.id} value={scene.id}>
                                            {scene.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedSceneId && shots.length > 0 && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">
                                        ショット (任意)
                                    </label>
                                    <select
                                        value={selectedShotId}
                                        onChange={(e) => setSelectedShotId(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="">選択しない</option>
                                        {shots.map((shot) => (
                                            <option key={shot.id} value={shot.id}>
                                                {shot.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedShotId && (
                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={saveToShot}
                                        onChange={(e) => setSaveToShot(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    ショットに直接リンク
                                </label>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-gray-800">
                    <button
                        onClick={() => setShowSaveModal(false)}
                        className="flex-1 btn btn-secondary"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSaveToLibrary}
                        disabled={isProcessing || !saveFileName.trim()}
                        className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FolderPlus className="w-4 h-4" />
                        )}
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}
