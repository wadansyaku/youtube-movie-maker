'use client';

import { useMemo, useState } from 'react';
import { saveDecisionLog } from '@/app/actions';
import { generateDecisionLog } from '@/app/settings/actions';
import {
    TOOL_DEFINITIONS,
    parseToolUsage,
    serializeToolUsage,
    ToolId,
    ToolUsageData,
    ToolUsageEntry,
    ToolUsageIssue,
} from '@/lib/ai-tool-usage';

interface DecisionLog {
    editorialIntent: string;
    differentiationPoints: string | null;
    humanContributions: string;
    aiToolUsage: string;
}

interface Props {
    episodeId: string;
    decisionLog: DecisionLog | null;
}

export default function DecisionLogEditor({ episodeId, decisionLog }: Props) {
    const [editorialIntent, setEditorialIntent] = useState(decisionLog?.editorialIntent || '');
    const [differentiationPoints, setDifferentiationPoints] = useState(
        decisionLog?.differentiationPoints || ''
    );
    const [humanContributions, setHumanContributions] = useState(
        decisionLog?.humanContributions || ''
    );
    const initialToolUsage = parseToolUsage(decisionLog?.aiToolUsage);
    const [toolUsage, setToolUsage] = useState<ToolUsageData>(initialToolUsage.data);
    const [toolUsageIssue] = useState<ToolUsageIssue | undefined>(initialToolUsage.issue);
    const [showToolUsageJson, setShowToolUsageJson] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const toolUsageJson = useMemo(() => serializeToolUsage(toolUsage), [toolUsage]);

    const toolUsageNotice = toolUsageIssue
        ? toolUsageIssue === 'legacy_converted'
            ? '旧形式のAIツール記録を新形式に変換しました。内容を確認してください。'
            : toolUsageIssue === 'invalid_json'
                ? 'AIツール使用記録のJSONが壊れていたため、テンプレートを適用しました。'
                : 'AIツール使用記録の形式を判別できなかったため、テンプレートを適用しました。'
        : null;

    const updateToolEntry = (toolId: ToolId, updates: Partial<ToolUsageEntry>) => {
        setToolUsage((prev) => ({
            ...prev,
            tools: {
                ...prev.tools,
                [toolId]: {
                    ...prev.tools[toolId],
                    ...updates,
                },
            },
        }));
    };

    const handleSave = async () => {
        setStatus('saving');
        try {
            const formData = new FormData();
            formData.set('editorialIntent', editorialIntent);
            formData.set('differentiationPoints', differentiationPoints);
            formData.set('humanContributions', humanContributions);
            formData.set('aiToolUsage', toolUsageJson);

            await saveDecisionLog(episodeId, formData);
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const handleAiAssist = async () => {
        const notes = prompt('編集意図や工夫した点のメモを入力してください（箇条書き推奨）:');
        if (!notes) return;

        setIsGenerating(true);
        try {
            const suggestion = await generateDecisionLog(notes);
            if (suggestion.editorialIntent) setEditorialIntent(suggestion.editorialIntent);
            if (suggestion.differentiationPoints) setDifferentiationPoints(suggestion.differentiationPoints);
        } catch (e) {
            alert('AI生成に失敗しました。API Keyが設定されているか確認してください。');
        } finally {
            setIsGenerating(false);
        }
    };

    const editorialIntentLength = editorialIntent.length;
    const humanContribLength = humanContributions.length;
    const editorialIntentComplete = editorialIntentLength >= 50;
    const humanContribComplete = humanContribLength >= 100;

    const isComplete =
        editorialIntentComplete && humanContribComplete;

    return (
        <div className="card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span>📝</span> Decision Log
                    {isComplete ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                            Complete
                        </span>
                    ) : (
                        <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-1 rounded-full">
                            Incomplete
                        </span>
                    )}
                </h3>
                <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={isGenerating}
                    className="btn btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                >
                    {isGenerating ? '✨ 生成中...' : '✨ AI Assist'}
                </button>
            </div>

            <p className="text-xs text-[var(--muted)] mb-4">
                YouTube収益化審査および著作権保護のため、AI生成コンテンツに対する
                「人間の創造的判断」の記録が必須です。
            </p>
            <div className="mb-4 space-y-2 text-xs">
                <div className={`flex items-center gap-2 ${editorialIntentComplete ? 'text-green-400' : 'text-accent-400'}`}>
                    <span>{editorialIntentComplete ? '✓' : '○'}</span>
                    <span>編集意図 50文字以上</span>
                </div>
                <div className={`flex items-center gap-2 ${humanContribComplete ? 'text-green-400' : 'text-accent-400'}`}>
                    <span>{humanContribComplete ? '✓' : '○'}</span>
                    <span>人間の貢献 100文字以上</span>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* 1. Editorial Intent */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        編集意図 (必須: 50文字以上)
                    </label>
                    <textarea
                        value={editorialIntent}
                        onChange={(e) => setEditorialIntent(e.target.value)}
                        className={`input w-full h-24 text-sm ${editorialIntentLength < 50 ? 'border-accent-500/50' : 'border-green-500/50'
                            }`}
                        placeholder="このエピソードを通じて視聴者に何を伝えたいか？なぜこの構成にしたか？"
                    />
                    <div className="text-right text-xs mt-1">
                        <span className={editorialIntentLength < 50 ? 'text-accent-400' : 'text-green-400'}>
                            {editorialIntentLength}
                        </span>
                        <span className="text-[var(--muted)]"> / 50</span>
                    </div>
                </div>

                {/* 2. Differentiation Points */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        差別化ポイント
                    </label>
                    <textarea
                        value={differentiationPoints}
                        onChange={(e) => setDifferentiationPoints(e.target.value)}
                        className="input w-full h-20 text-sm"
                        placeholder="他のAI生成コンテンツや既存の動画とどう違うか？独自の視点は？"
                    />
                </div>

                {/* 3. Human Contributions */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        人間の貢献 (必須: 100文字以上)
                    </label>
                    <textarea
                        value={humanContributions}
                        onChange={(e) => setHumanContributions(e.target.value)}
                        className={`input w-full h-32 text-sm ${humanContribLength < 100 ? 'border-accent-500/50' : 'border-green-500/50'
                            }`}
                        placeholder="AIの出力をどう選別・修正・編集したか？具体的な作業内容を記録してください。"
                    />
                    <div className="text-right text-xs mt-1">
                        <span className={humanContribLength < 100 ? 'text-accent-400' : 'text-green-400'}>
                            {humanContribLength}
                        </span>
                        <span className="text-[var(--muted)]"> / 100</span>
                    </div>
                </div>

                {/* 4. AI Tool Usage */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium">
                            AIツール使用記録
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowToolUsageJson((prev) => !prev)}
                            className="text-xs text-primary-400 hover:text-primary-300"
                        >
                            {showToolUsageJson ? 'JSONを隠す' : 'JSONを表示'}
                        </button>
                    </div>

                    {toolUsageNotice && (
                        <div
                            className={`p-3 rounded-lg text-xs ${toolUsageIssue === 'invalid_json'
                                    ? 'bg-red-900/30 border border-red-500/30 text-red-200'
                                    : 'bg-yellow-900/20 border border-yellow-500/30 text-yellow-200'
                                }`}
                        >
                            {toolUsageNotice}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-[var(--muted)] mb-1">
                            利用サマリー（任意）
                        </label>
                        <input
                            value={toolUsage.summary}
                            onChange={(e) =>
                                setToolUsage((prev) => ({ ...prev, summary: e.target.value }))
                            }
                            className="input w-full text-sm"
                            placeholder="例: 企画はChatGPT、音楽はSuno、編集はFCPで実施"
                        />
                    </div>

                    <div className="space-y-3">
                        {TOOL_DEFINITIONS.map((tool) => {
                            const entry = toolUsage.tools[tool.id];
                            return (
                                <div
                                    key={tool.id}
                                    className="bg-[#0f0f14]/60 border border-white/5 rounded-lg p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">{tool.label}</div>
                                        <label className="text-xs flex items-center gap-2 text-[var(--muted)]">
                                            <input
                                                type="checkbox"
                                                checked={entry.used}
                                                onChange={(e) =>
                                                    updateToolEntry(tool.id, { used: e.target.checked })
                                                }
                                            />
                                            使用
                                        </label>
                                    </div>
                                    <div className="grid gap-2 mt-2">
                                        <input
                                            value={entry.purpose}
                                            onChange={(e) =>
                                                updateToolEntry(tool.id, { purpose: e.target.value })
                                            }
                                            className="input w-full text-sm"
                                            placeholder="用途/目的"
                                        />
                                        <input
                                            value={entry.output}
                                            onChange={(e) =>
                                                updateToolEntry(tool.id, { output: e.target.value })
                                            }
                                            className="input w-full text-sm"
                                            placeholder="成果物/出力"
                                        />
                                        <textarea
                                            value={entry.notes}
                                            onChange={(e) =>
                                                updateToolEntry(tool.id, { notes: e.target.value })
                                            }
                                            className="input w-full h-20 text-sm"
                                            placeholder="備考 / 選定理由 / 修正内容"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {showToolUsageJson && (
                        <pre className="text-xs bg-[#0f0f14] p-3 rounded-lg overflow-auto max-h-48">
                            {toolUsageJson}
                        </pre>
                    )}
                </div>
            </div>

            <div className="pt-4 mt-auto border-t border-white/5">
                <button
                    onClick={handleSave}
                    disabled={status === 'saving'}
                    className="btn btn-primary w-full"
                >
                    {status === 'saving' ? '保存中...' : status === 'saved' ? '保存完了！' : 'Decision Logを保存'}
                </button>
            </div>
        </div>
    );
}
