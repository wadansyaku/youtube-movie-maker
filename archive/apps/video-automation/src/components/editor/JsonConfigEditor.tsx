'use client';

import { useState, useCallback, useMemo, DragEvent } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import { VideoConfig, Section } from '@/remotion/types/video';

interface JsonConfigEditorProps {
    config: VideoConfig;
    onChange: (config: VideoConfig) => void;
}

const sectionTypes = [
    { value: 'hook', label: 'Hook（導入）', color: '#667eea' },
    { value: 'keypoint', label: 'Keypoint（ポイント）', color: '#f093fb' },
    { value: 'quiz', label: 'Quiz（クイズ）', color: '#ff9a56' },
    { value: 'recap', label: 'Recap（まとめ）', color: '#4facfe' },
    { value: 'conclusion', label: 'Conclusion（結論）', color: '#38ef7d' },
] as const;

const getSectionColor = (type: string) => {
    return sectionTypes.find(t => t.value === type)?.color || '#888';
};

export function JsonConfigEditor({ config, onChange }: JsonConfigEditorProps) {
    const [expandedSection, setExpandedSection] = useState<number | null>(0);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Calculate total duration from sections
    const totalDuration = useMemo(() => {
        if (config.sections.length === 0) return config.duration;
        return Math.max(...config.sections.map(s => s.endSec), config.duration);
    }, [config.sections, config.duration]);

    const updateField = useCallback(<K extends keyof VideoConfig>(
        field: K,
        value: VideoConfig[K]
    ) => {
        onChange({ ...config, [field]: value });
    }, [config, onChange]);

    const updateSection = useCallback((index: number, updates: Partial<Section>) => {
        const newSections = [...config.sections];
        newSections[index] = { ...newSections[index], ...updates } as Section;
        onChange({ ...config, sections: newSections });
    }, [config, onChange]);

    const addSection = useCallback(() => {
        const lastSection = config.sections[config.sections.length - 1];
        const newStartSec = lastSection ? lastSection.endSec : 0;
        const newSection: Section = {
            type: 'keypoint',
            startSec: newStartSec,
            endSec: newStartSec + 10,
            onScreenText: '新しいセクション',
        };
        onChange({ ...config, sections: [...config.sections, newSection] });
        setExpandedSection(config.sections.length);
    }, [config, onChange]);

    const removeSection = useCallback((index: number) => {
        const newSections = config.sections.filter((_, i) => i !== index);
        onChange({ ...config, sections: newSections });
        setExpandedSection(null);
        setDeleteConfirm(null);
    }, [config, onChange]);

    const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
        const newSections = [...config.sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        onChange({ ...config, sections: newSections });
        setExpandedSection(targetIndex);
    }, [config, onChange]);

    // Drag and Drop handlers
    const handleDragStart = (e: DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (e: DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            const newSections = [...config.sections];
            const [removed] = newSections.splice(draggedIndex, 1);
            newSections.splice(targetIndex, 0, removed);
            onChange({ ...config, sections: newSections });
            setExpandedSection(targetIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <div className="card p-4 space-y-4">
                <h3 className="font-semibold">基本情報</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">タイトル</label>
                        <input
                            type="text"
                            value={config.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">テーマラベル</label>
                        <input
                            type="text"
                            value={config.themeLabel}
                            onChange={(e) => updateField('themeLabel', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">テーマ</label>
                        <select
                            value={config.themeId || 'medical-dark'}
                            onChange={(e) => updateField('themeId', e.target.value as VideoConfig['themeId'])}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                        >
                            <option value="medical-dark">Medical Dark</option>
                            <option value="medical-light">Medical Light</option>
                            <option value="pop-quiz">Pop Quiz</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">長さ（秒）</label>
                        <input
                            type="number"
                            value={config.duration}
                            onChange={(e) => updateField('duration', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-[var(--muted)] mb-1">免責事項</label>
                    <input
                        type="text"
                        value={config.disclaimer || ''}
                        onChange={(e) => updateField('disclaimer', e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg"
                        placeholder="この動画は教育目的です"
                    />
                </div>
            </div>

            {/* Timeline View */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="font-semibold">タイムライン</h3>
                    <span className="text-sm text-[var(--muted)] ml-auto">{totalDuration}秒</span>
                </div>

                {/* Timeline Bar */}
                <div className="relative h-12 bg-[var(--background)] rounded-lg overflow-hidden border border-[var(--border)]">
                    {config.sections.map((section, index) => {
                        const left = (section.startSec / totalDuration) * 100;
                        const width = ((section.endSec - section.startSec) / totalDuration) * 100;
                        return (
                            <div
                                key={index}
                                className="absolute h-full flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    backgroundColor: getSectionColor(section.type),
                                    opacity: expandedSection === index ? 1 : 0.7,
                                    borderRight: '1px solid rgba(0,0,0,0.2)',
                                }}
                                onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                                title={`${section.type}: ${section.startSec}s - ${section.endSec}s`}
                            >
                                <span
                                    className="text-xs font-medium text-white truncate px-1"
                                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                >
                                    {width > 8 ? section.type : ''}
                                </span>
                            </div>
                        );
                    })}

                    {/* Time markers */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-0.5 text-[10px] text-[var(--muted)]">
                        <span>0s</span>
                        <span>{Math.floor(totalDuration / 2)}s</span>
                        <span>{totalDuration}s</span>
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">セクション ({config.sections.length})</h3>
                    <button
                        onClick={addSection}
                        className="btn btn-secondary text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        追加
                    </button>
                </div>

                <div className="space-y-2">
                    {config.sections.map((section, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg overflow-hidden transition-all ${dragOverIndex === index
                                    ? 'border-[var(--accent)] border-2'
                                    : 'border-[var(--border)]'
                                } ${draggedIndex === index ? 'opacity-50' : ''
                                }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Section Header */}
                            <div
                                className="flex items-center gap-2 p-3 bg-[var(--background)] cursor-pointer"
                                onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                            >
                                <GripVertical className="w-4 h-4 text-[var(--muted)] cursor-grab active:cursor-grabbing" />
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getSectionColor(section.type) }}
                                />
                                <span className="badge badge-info text-xs">{section.type}</span>
                                <span className="flex-1 text-sm truncate">
                                    {section.onScreenText || section.type}
                                </span>
                                <span className="text-xs text-[var(--muted)]">
                                    {section.startSec}s - {section.endSec}s
                                </span>
                                {expandedSection === index ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </div>

                            {/* Section Details */}
                            {expandedSection === index && (
                                <div className="p-4 space-y-3 border-t border-[var(--border)]">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-[var(--muted)] mb-1">タイプ</label>
                                            <select
                                                value={section.type}
                                                onChange={(e) => updateSection(index, { type: e.target.value as Section['type'] })}
                                                className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded"
                                            >
                                                {sectionTypes.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-[var(--muted)] mb-1">開始（秒）</label>
                                            <input
                                                type="number"
                                                value={section.startSec}
                                                onChange={(e) => updateSection(index, { startSec: Number(e.target.value) })}
                                                className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-[var(--muted)] mb-1">終了（秒）</label>
                                            <input
                                                type="number"
                                                value={section.endSec}
                                                onChange={(e) => updateSection(index, { endSec: Number(e.target.value) })}
                                                className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded"
                                            />
                                        </div>
                                    </div>

                                    {/* Time Range Slider */}
                                    <div>
                                        <label className="block text-xs text-[var(--muted)] mb-2">時間範囲</label>
                                        <div className="relative h-2 bg-[var(--border)] rounded-full">
                                            <div
                                                className="absolute h-full rounded-full transition-all"
                                                style={{
                                                    left: `${(section.startSec / totalDuration) * 100}%`,
                                                    width: `${((section.endSec - section.startSec) / totalDuration) * 100}%`,
                                                    backgroundColor: getSectionColor(section.type),
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-[var(--muted)]">
                                            <span>{section.startSec}s</span>
                                            <span>{section.endSec - section.startSec}s duration</span>
                                            <span>{section.endSec}s</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-[var(--muted)] mb-1">表示テキスト</label>
                                        <textarea
                                            value={section.onScreenText || ''}
                                            onChange={(e) => updateSection(index, { onScreenText: e.target.value })}
                                            className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded resize-none"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => moveSection(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 rounded hover:bg-[var(--card-hover)] disabled:opacity-30"
                                                title="上へ移動"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => moveSection(index, 'down')}
                                                disabled={index === config.sections.length - 1}
                                                className="p-1 rounded hover:bg-[var(--card-hover)] disabled:opacity-30"
                                                title="下へ移動"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {deleteConfirm === index ? (
                                            <div className="flex items-center gap-2 animate-pulse">
                                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                                <span className="text-xs text-yellow-400">本当に削除しますか？</span>
                                                <button
                                                    onClick={() => removeSection(index)}
                                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    削除
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="text-xs px-2 py-1 bg-[var(--border)] rounded hover:bg-[var(--card-hover)]"
                                                >
                                                    キャンセル
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(index)}
                                                className="text-red-400 hover:text-red-300 p-1 rounded"
                                                title="セクションを削除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
