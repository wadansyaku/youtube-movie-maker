'use client';

import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { MedicalShorts } from '../../remotion/MedicalShorts';
import { VideoConfig, Section } from '../../remotion/types/video';
import { themes } from '../../remotion/styles/theme';
import {
    ChevronRight,
    ChevronLeft,
    Download,
    Play,
    Sparkles,
    Brain,
    Lightbulb,
    HelpCircle,
    Plus,
    Trash2,
    GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

// テンプレート定義
const templates = [
    {
        id: 'brain-facts',
        name: '脳科学トリビア',
        icon: <Brain className="h-8 w-8" />,
        description: '脳に関する驚きの事実を紹介',
        sceneCount: 5,
        themeId: 'medical-dark' as const,
        themeLabel: '🧠 脳科学の豆知識',
        defaultSections: [
            { type: 'hook' as const, onScreenText: 'あなたの脳は\n1日に○○回思考してる\n...って知ってた？' },
            { type: 'keypoint' as const, onScreenText: '① ポイント1を入力' },
            { type: 'keypoint' as const, onScreenText: '② ポイント2を入力' },
            { type: 'quiz' as const, question: 'クイズの質問', choices: ['選択肢A', '選択肢B', '選択肢C'], answer: '選択肢B' },
            { type: 'conclusion' as const, onScreenText: '🔔 フォローして\nもっと知識を得よう！' },
        ],
    },
    {
        id: 'medical-tips',
        name: '医学豆知識',
        icon: <Lightbulb className="h-8 w-8" />,
        description: '健康に関する役立つ情報',
        sceneCount: 4,
        themeId: 'medical-light' as const,
        themeLabel: '💊 医学の豆知識',
        defaultSections: [
            { type: 'hook' as const, onScreenText: '知っていましたか？\n〇〇の意外な事実' },
            { type: 'keypoint' as const, onScreenText: '① 重要なポイント1' },
            { type: 'keypoint' as const, onScreenText: '② 重要なポイント2' },
            { type: 'conclusion' as const, onScreenText: '💡 健康のために\n今日から実践しよう！' },
        ],
    },
    {
        id: 'quiz-show',
        name: 'クイズ形式',
        icon: <HelpCircle className="h-8 w-8" />,
        description: '視聴者参加型のクイズ動画',
        sceneCount: 4,
        themeId: 'pop-quiz' as const,
        themeLabel: '❓ クイズタイム',
        defaultSections: [
            { type: 'hook' as const, onScreenText: '今日のクイズ！\n正解できるかな？' },
            { type: 'quiz' as const, question: 'クイズの質問を入力', choices: ['選択肢A', '選択肢B', '選択肢C'], answer: '選択肢A' },
            { type: 'keypoint' as const, onScreenText: '解説：\n正解の理由を説明' },
            { type: 'conclusion' as const, onScreenText: '🎯 正解できた？\nコメントで教えてね！' },
        ],
    },
    {
        id: 'dialogue-20scene',
        name: '20シーン対話形式',
        icon: <Sparkles className="h-8 w-8" />,
        description: 'AIキャラクターが対話する本格動画',
        sceneCount: 20,
        themeId: 'medical-dark' as const,
        themeLabel: '🎭 対話シリーズ',
        characters: [
            { id: 'sensei', name: '先生', color: '#8B5CF6' },
            { id: 'student', name: '生徒', color: '#06B6D4' },
        ],
        defaultSections: [
            { type: 'title' as const, mainTitle: 'タイトルを入力', subtitle: '脳科学シリーズ Day 1' },
            { type: 'hook' as const, onScreenText: '衝撃の事実でフック！' },
            { type: 'character' as const, characterId: 'sensei', introText: '今日も脳の秘密を教えるよ！' },
            { type: 'dialogue' as const, dialogues: [{ characterId: 'student', text: '先生、それ本当？', emotion: 'surprised' }] },
            { type: 'transition' as const, transitionText: '実は...', style: 'dramatic' },
            { type: 'fact' as const, number: '7万', unit: '回', description: '脳が1日に思考する回数' },
            { type: 'story' as const, narration: 'これについて詳しく説明すると...', mood: 'exciting' },
            { type: 'dialogue' as const, dialogues: [{ characterId: 'student', text: 'すごい！', emotion: 'excited' }, { characterId: 'sensei', text: 'まだあるよ', emotion: 'happy' }] },
            { type: 'fact' as const, number: '20%', unit: '', description: '脳が消費するエネルギーの割合' },
            { type: 'comparison' as const, leftLabel: '知らない人', leftContent: '効率が悪い', rightLabel: '知ってる人', rightContent: '脳を最大活用' },
            { type: 'dialogue' as const, dialogues: [{ characterId: 'student', text: 'なるほど！', emotion: 'thinking' }] },
            { type: 'transition' as const, transitionText: '🧠 クイズタイム！', style: 'flash' },
            { type: 'quiz' as const, question: '脳の重さは約何グラム？', choices: ['約500g', '約1,400g', '約3,000g'], answer: '約1,400g' },
            { type: 'countdown' as const, startNumber: 3, label: '考えて！' },
            { type: 'reveal' as const, buildup: '正解は...', revealText: '約1,400g！', celebrationEffect: true },
            { type: 'fact' as const, number: '1000億', unit: '個', description: '脳の神経細胞の数' },
            { type: 'story' as const, narration: 'つまり、脳は無限の可能性を秘めています', mood: 'calm' },
            { type: 'dialogue' as const, dialogues: [{ characterId: 'student', text: '今日も勉強になった！', emotion: 'happy' }, { characterId: 'sensei', text: 'また明日ね！', emotion: 'happy' }] },
            { type: 'recap' as const, onScreenText: '今日のまとめ', points: ['脳は1日7万回思考', 'エネルギー20%消費', '1000億の神経細胞'] },
            { type: 'conclusion' as const, onScreenText: 'フォローして毎日学ぼう！', ctaText: '🔔 通知をオン！' },
        ],
    },
];

// ステップ定義
const steps = [
    { id: 1, name: 'テンプレートを選ぶ', description: '動画のスタイルを選択' },
    { id: 2, name: '内容を入力', description: 'テキストを編集' },
    { id: 3, name: 'プレビュー＆書き出し', description: '確認して完成' },
];

export default function ShortsMakerPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
    const [config, setConfig] = useState<VideoConfig | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // テンプレート選択時
    const handleSelectTemplate = (template: typeof templates[0]) => {
        setSelectedTemplate(template);

        // セクションにタイミングを追加
        // 20シーンテンプレートは1シーン3秒（合計60秒）
        const is20Scene = template.id === 'dialogue-20scene';
        let currentTime = 0;
        const sectionsWithTiming: Section[] = template.defaultSections.map((section, index) => {
            // 20シーンは3秒固定、それ以外は従来のロジック
            const duration = is20Scene
                ? 3
                : (section.type === 'quiz' ? 15 : section.type === 'hook' ? 6 : 10);
            const result = {
                ...section,
                startSec: currentTime,
                endSec: currentTime + duration,
            } as Section;
            currentTime += duration;
            return result;
        });

        setConfig({
            title: `${template.name}動画`,
            themeLabel: template.themeLabel,
            themeId: template.themeId,
            duration: currentTime,
            sections: sectionsWithTiming,
            disclaimer: '※ 内容は概算・参考情報です',
        });

        setCurrentStep(2);
        toast.success(`「${template.name}」を選択しました`);
    };

    // セクション更新
    const updateSection = (index: number, updates: Partial<Section>) => {
        if (!config) return;
        const newSections = [...config.sections];
        newSections[index] = { ...newSections[index], ...updates } as Section;
        setConfig({ ...config, sections: newSections });
    };

    // セクション削除
    const removeSection = (index: number) => {
        if (!config || config.sections.length <= 2) {
            toast.error('最低2つのセクションが必要です');
            return;
        }
        const newSections = config.sections.filter((_, i) => i !== index);
        // タイミング再計算
        let currentTime = 0;
        const recalculated = newSections.map((section) => {
            const duration = section.type === 'quiz' ? 15 : section.type === 'hook' ? 6 : 10;
            const result = { ...section, startSec: currentTime, endSec: currentTime + duration };
            currentTime += duration;
            return result;
        });
        setConfig({ ...config, sections: recalculated, duration: currentTime });
    };

    // セクション追加
    const addSection = (type: 'keypoint' | 'quiz') => {
        if (!config) return;
        const lastSection = config.sections[config.sections.length - 1];
        const duration = type === 'quiz' ? 15 : 10;
        const newSection: Section = type === 'quiz'
            ? {
                type: 'quiz',
                startSec: lastSection.endSec,
                endSec: lastSection.endSec + duration,
                question: '新しいクイズ',
                choices: ['選択肢A', '選択肢B', '選択肢C'],
                answer: '選択肢A'
            }
            : {
                type: 'keypoint',
                startSec: lastSection.endSec,
                endSec: lastSection.endSec + duration,
                onScreenText: '新しいポイント'
            };

        // 結論の前に挿入
        const conclusionIndex = config.sections.findIndex(s => s.type === 'conclusion');
        const insertIndex = conclusionIndex >= 0 ? conclusionIndex : config.sections.length;

        const newSections = [
            ...config.sections.slice(0, insertIndex),
            newSection,
            ...config.sections.slice(insertIndex)
        ];

        // タイミング再計算
        let currentTime = 0;
        const recalculated = newSections.map((section) => {
            const dur = section.type === 'quiz' ? 15 : section.type === 'hook' ? 6 : 10;
            const result = { ...section, startSec: currentTime, endSec: currentTime + dur };
            currentTime += dur;
            return result;
        });

        setConfig({ ...config, sections: recalculated, duration: currentTime });
        toast.success('セクションを追加しました');
    };

    // JSON書き出し
    const handleExport = () => {
        if (!config) return;
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.title}.json`;
        a.click();
        toast.success('レシピファイルを保存しました！');
    };

    // セクションタイプの日本語名
    const getSectionTypeName = (type: string) => {
        const names: Record<string, string> = {
            hook: '🎣 フック（つかみ）',
            keypoint: '💡 ポイント',
            quiz: '❓ クイズ',
            recap: '📝 まとめ',
            conclusion: '🔔 結論・CTA',
        };
        return names[type] || type;
    };

    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* ヘッダー */}
            <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-indigo-400" />
                                ショート動画を作ろう
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                3ステップで簡単にYouTubeショートを作成
                            </p>
                        </div>

                        {/* ステップインジケーター */}
                        <div className="flex items-center gap-2">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <button
                                        onClick={() => {
                                            if (step.id === 1 || (step.id === 2 && selectedTemplate) || (step.id === 3 && config)) {
                                                setCurrentStep(step.id);
                                            }
                                        }}
                                        disabled={step.id > 1 && !selectedTemplate}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${currentStep === step.id
                                            ? 'bg-indigo-600 text-white'
                                            : currentStep > step.id
                                                ? 'bg-indigo-600/20 text-indigo-300'
                                                : 'bg-gray-800 text-gray-500'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">
                                            {step.id}
                                        </span>
                                        <span className="hidden md:inline text-sm">{step.name}</span>
                                    </button>
                                    {index < steps.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* ステップ1: テンプレート選択 */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-semibold mb-2">どんな動画を作りますか？</h2>
                            <p className="text-gray-400">テンプレートを選んでスタート</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSelectTemplate(template)}
                                    className="group relative overflow-hidden rounded-2xl border-2 border-gray-800 bg-gray-900 p-6 text-left transition-all hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                            {template.icon}
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                                        <p className="text-sm text-gray-400">{template.description}</p>
                                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                            <span className="px-2 py-1 bg-gray-800 rounded">{template.defaultSections.length}シーン</span>
                                            <span className="px-2 py-1 bg-gray-800 rounded">{template.themeId}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-sm text-gray-500">
                                💡 ヒント: テンプレートは後から自由にカスタマイズできます
                            </p>
                        </div>
                    </div>
                )}

                {/* ステップ2: 内容入力 */}
                {currentStep === 2 && config && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 左: エディタ */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">シーン構成</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => addSection('keypoint')}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        ポイント追加
                                    </button>
                                    <button
                                        onClick={() => addSection('quiz')}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        クイズ追加
                                    </button>
                                </div>
                            </div>

                            {/* タイトル */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2">動画タイトル</label>
                                <input
                                    type="text"
                                    value={config.title}
                                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="動画のタイトルを入力"
                                />
                            </div>

                            {/* セクション一覧 */}
                            <div className="space-y-3">
                                {config.sections.map((section, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-900 border border-gray-800 rounded-xl p-4 group"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-gray-600" />
                                                <span className="text-sm font-medium">{getSectionTypeName(section.type)}</span>
                                                <span className="text-xs text-gray-500">
                                                    {section.startSec}秒 〜 {section.endSec}秒
                                                </span>
                                            </div>
                                            {section.type !== 'hook' && section.type !== 'conclusion' && (
                                                <button
                                                    onClick={() => removeSection(index)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/10 rounded transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {section.type === 'quiz' ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={(section as any).question}
                                                    onChange={(e) => updateSection(index, { question: e.target.value } as any)}
                                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                    placeholder="クイズの質問"
                                                />
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(section as any).choices.map((choice: string, ci: number) => (
                                                        <input
                                                            key={ci}
                                                            type="text"
                                                            value={choice}
                                                            onChange={(e) => {
                                                                const newChoices = [...(section as any).choices];
                                                                newChoices[ci] = e.target.value;
                                                                updateSection(index, { choices: newChoices } as any);
                                                            }}
                                                            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                            placeholder={`選択肢${ci + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                                <select
                                                    value={(section as any).answer}
                                                    onChange={(e) => updateSection(index, { answer: e.target.value } as any)}
                                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                >
                                                    {(section as any).choices.map((choice: string, ci: number) => (
                                                        <option key={ci} value={choice}>{choice}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <textarea
                                                value={section.onScreenText || ''}
                                                onChange={(e) => updateSection(index, { onScreenText: e.target.value })}
                                                rows={2}
                                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                                                placeholder="画面に表示するテキスト"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* ナビゲーション */}
                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    戻る
                                </button>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
                                >
                                    プレビューへ
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* 右: ミニプレビュー */}
                        <div className="lg:sticky lg:top-24">
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-4 text-center">プレビュー</h3>
                                <div className="flex justify-center">
                                    <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                                        <Player
                                            component={MedicalShorts as any}
                                            inputProps={config as any}
                                            durationInFrames={Math.round(config.duration * 30)}
                                            fps={30}
                                            compositionWidth={1080}
                                            compositionHeight={1920}
                                            style={{ width: 180, height: 320 }}
                                            controls
                                            loop
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    合計 {config.duration}秒 • {config.sections.length}シーン
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ステップ3: プレビュー＆書き出し */}
                {currentStep === 3 && config && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">プレビューを確認</h2>
                            <p className="text-gray-400">問題なければ書き出しましょう</p>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
                            {/* 大きなプレビュー */}
                            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
                                <Player
                                    component={MedicalShorts as any}
                                    inputProps={config as any}
                                    durationInFrames={Math.round(config.duration * 30)}
                                    fps={30}
                                    compositionWidth={1080}
                                    compositionHeight={1920}
                                    style={{ width: 270, height: 480 }}
                                    controls
                                    loop
                                    autoPlay
                                />
                            </div>

                            {/* 情報＆アクション */}
                            <div className="space-y-4 w-full lg:w-80">
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                                    <h3 className="font-medium">{config.title}</h3>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 bg-gray-800 rounded">{config.duration}秒</span>
                                        <span className="px-2 py-1 bg-gray-800 rounded">{config.sections.length}シーン</span>
                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">{config.themeId}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-800">
                                        <p className="text-xs text-gray-500">{config.themeLabel}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleExport}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
                                >
                                    <Download className="h-5 w-5" />
                                    レシピファイルを保存
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    💡 保存したファイルは「自動制作」で<br />
                                    動画に変換できます
                                </p>

                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white border border-gray-800 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    編集に戻る
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
