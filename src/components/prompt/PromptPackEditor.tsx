'use client';

import { useState } from 'react';
import { addPrompt, deletePromptPack } from '@/app/actions';

interface Prompt {
    id: string;
    type: string;
    name: string;
    content: string;
    variables: string;
}

interface PromptPack {
    id: string;
    name: string;
    category: string;
    prompts: Prompt[];
}

interface Props {
    promptPack: PromptPack;
    seriesId: string;
}

const categoryLabels: Record<string, string> = {
    general: '一般',
    visual: 'ビジュアル',
    audio: 'オーディオ',
    narrative: 'ナラティブ',
};

const typeOptions: Record<string, { value: string; label: string }[]> = {
    visual: [
        { value: 'runway_workflow', label: 'Workflow設定' },
        { value: 'runway_prompt', label: 'プロンプト' },
    ],
    audio: [
        { value: 'suno_style', label: 'スタイル' },
        { value: 'suno_lyrics', label: '歌詞テンプレート' },
    ],
    narrative: [
        { value: 'script', label: '台本テンプレート' },
        { value: 'narration', label: 'ナレーション' },
    ],
    general: [
        { value: 'general', label: '汎用' },
    ],
};

export default function PromptPackEditor({ promptPack, seriesId }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newPromptName, setNewPromptName] = useState('');
    const [newPromptType, setNewPromptType] = useState(
        typeOptions[promptPack.category]?.[0]?.value || 'general'
    );
    const [newPromptContent, setNewPromptContent] = useState('');

    const handleAddPrompt = async () => {
        if (!newPromptName || !newPromptContent) return;

        const formData = new FormData();
        formData.set('type', newPromptType);
        formData.set('name', newPromptName);
        formData.set('content', newPromptContent);
        formData.set('variables', '{}');

        await addPrompt(promptPack.id, formData);
        setNewPromptName('');
        setNewPromptContent('');
    };

    const handleDelete = async () => {
        if (confirm('このPromptPackを削除しますか？')) {
            await deletePromptPack(promptPack.id, seriesId);
        }
    };

    return (
        <div className="card">
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#2a2a3a] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">
                        {isExpanded ? '📂' : '📁'}
                    </span>
                    <div>
                        <h3 className="font-medium">{promptPack.name}</h3>
                        <span className="text-xs text-[var(--muted)]">
                            {categoryLabels[promptPack.category]} • {promptPack.prompts.length} プロンプト
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        className="text-xs text-accent-400 hover:underline"
                    >
                        削除
                    </button>
                    <span className="text-[var(--muted)]">
                        {isExpanded ? '▼' : '▶'}
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-[var(--card-border)] p-4 space-y-4">
                    {/* Existing Prompts */}
                    {promptPack.prompts.length > 0 && (
                        <div className="space-y-2">
                            {promptPack.prompts.map((prompt) => (
                                <div key={prompt.id} className="bg-[#0f0f14] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm">{prompt.name}</span>
                                        <span className="badge text-xs">{prompt.type}</span>
                                    </div>
                                    <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap">
                                        {prompt.content}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Prompt */}
                    <div className="border-t border-[var(--card-border)] pt-4">
                        <h4 className="text-sm font-medium mb-3">+ 新しいプロンプトを追加</h4>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newPromptName}
                                    onChange={(e) => setNewPromptName(e.target.value)}
                                    placeholder="プロンプト名"
                                    className="input flex-1"
                                />
                                <select
                                    value={newPromptType}
                                    onChange={(e) => setNewPromptType(e.target.value)}
                                    className="input w-auto"
                                >
                                    {(typeOptions[promptPack.category] || typeOptions.general).map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <textarea
                                value={newPromptContent}
                                onChange={(e) => setNewPromptContent(e.target.value)}
                                placeholder="プロンプト内容..."
                                className="textarea"
                                rows={4}
                            />
                            <button
                                onClick={handleAddPrompt}
                                disabled={!newPromptName || !newPromptContent}
                                className="btn btn-secondary"
                            >
                                追加
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
