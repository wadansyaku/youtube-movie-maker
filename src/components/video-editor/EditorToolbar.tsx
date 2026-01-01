'use client';

import { Scissors, Type, FileText, Keyboard } from 'lucide-react';
import { useVideoEditorContext } from './VideoEditorContext';
import { EditorMode } from './types';

const MODES: { key: EditorMode; label: string; icon: React.ReactNode }[] = [
    { key: 'edit', label: '動画編集モード', icon: <Scissors className="w-4 h-4" /> },
    { key: 'generate', label: 'テキストから生成', icon: <Type className="w-4 h-4" /> },
    { key: 'slides', label: 'Dynamic Slides', icon: <FileText className="w-4 h-4" /> },
];

export function EditorToolbar() {
    const {
        mode,
        setMode,
        dynamicSlidesEnabled,
        setDynamicSlidesEnabled,
    } = useVideoEditorContext();

    const availableModes = dynamicSlidesEnabled ? MODES : MODES.filter(m => m.key !== 'slides');

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Mode Tabs */}
            <div className="flex bg-gray-800 rounded-lg p-1">
                {availableModes.map((m) => (
                    <button
                        key={m.key}
                        onClick={() => setMode(m.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === m.key
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        {m.icon}
                        <span className="hidden sm:inline">{m.label}</span>
                    </button>
                ))}
            </div>

            {/* Dynamic Slides Toggle */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={dynamicSlidesEnabled}
                        onChange={(e) => setDynamicSlidesEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    Dynamic Slides
                </label>

                <div className="flex items-center gap-1 text-xs text-gray-500" title="キーボードショートカット">
                    <Keyboard className="w-3 h-3" />
                    <span className="hidden lg:inline">⌘Z/Y/S</span>
                </div>
            </div>
        </div>
    );
}
