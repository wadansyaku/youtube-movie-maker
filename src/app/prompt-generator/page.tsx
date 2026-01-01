'use client';

import React, { useState, useEffect } from 'react';
import {
    Video,
    Music,
    Mic,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Film,
    Zap,
    Upload
} from 'lucide-react';
import { toast } from 'sonner';

// Runway Gen4/4.5用のプロンプトテンプレート
const runwayPromptTemplate = (section: any, index: number) => {
    const cameraMotions = ['static camera', 'slow dolly in', 'tracking shot', 'pan right', 'aerial view'];
    const lightingStyles = ['soft natural light', 'neon glow', 'cinematic lighting', 'warm golden hour'];

    const basePrompt = {
        title: `A cinematic shot of animated character. ${section.visualDescription || section.narration || section.onScreenText || ''}`,
        camera: cameraMotions[index % cameraMotions.length],
        lighting: lightingStyles[index % lightingStyles.length],
        style: 'smooth animation, high quality, 4K, modern educational content style',
    };

    return `${basePrompt.title}. ${basePrompt.camera}, ${basePrompt.lighting}. ${basePrompt.style}`;
};

// Suno AI BGMプロンプトテンプレート
const sunoPromptTemplates = {
    educational: {
        style: 'Uplifting lo-fi hip hop, educational content',
        instruments: 'soft piano, gentle synth pads, light percussion',
        mood: 'curious, inspiring, calm',
        structure: '[Intro: 8 bars] [Loop: 16 bars] [Outro: 4 bars]',
        tempo: 'mid-tempo, 90 BPM',
        vocal: 'instrumental only, no vocals',
    },
    dramatic: {
        style: 'Cinematic orchestral, epic reveal',
        instruments: 'strings, brass, timpani, choir',
        mood: 'dramatic, building tension, triumphant',
        structure: '[Build: 8 bars] [Climax: 8 bars] [Resolution: 8 bars]',
        tempo: 'moderate, 100 BPM',
        vocal: 'instrumental only',
    },
    quiz: {
        style: 'Playful electronic, game show vibe',
        instruments: 'synth leads, electronic drums, bells',
        mood: 'exciting, suspenseful, fun',
        structure: '[Question: 8 bars] [Countdown: 4 bars] [Answer: 8 bars]',
        tempo: 'upbeat, 120 BPM',
        vocal: 'instrumental only',
    },
};

// Google AI Studio TTS用の日本語ボイス
const ttsVoices = [
    { id: 'Zephyr', name: 'Zephyr', desc: 'Bright - 明るい' },
    { id: 'Charon', name: 'Charon', desc: 'Informative - 解説向き' },
    { id: 'Kore', name: 'Kore', desc: 'Firm - しっかりした' },
    { id: 'Fenrir', name: 'Fenrir', desc: 'Excitable - 興奮気味' },
    { id: 'Leda', name: 'Leda', desc: 'Youthful - 若々しい' },
    { id: 'Aoede', name: 'Aoede', desc: 'Breezy - さわやか' },
    { id: 'Sulafar', name: 'Sulafar', desc: 'Warm - 温かみ' },
    { id: 'Achird', name: 'Achird', desc: 'Friendly - フレンドリー' },
];

interface PromptOutput {
    type: 'runway' | 'suno' | 'tts';
    label: string;
    prompt: string;
    section?: number;
}

export default function PromptGeneratorPage() {
    const [config, setConfig] = useState<any>(null);
    const [outputs, setOutputs] = useState<PromptOutput[]>([]);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['runway', 'suno', 'tts']));
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [selectedVoiceSensei, setSelectedVoiceSensei] = useState('Charon');
    const [selectedVoiceStudent, setSelectedVoiceStudent] = useState('Fenrir');
    const [bgmStyle, setBgmStyle] = useState<keyof typeof sunoPromptTemplates>('educational');

    // ファイルアップロード
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                setConfig(json);
                generatePrompts(json);
                toast.success('レシピファイルを読み込みました');
            } catch (err) {
                toast.error('JSONの解析に失敗しました');
            }
        };
        reader.readAsText(file);
    };

    // プロンプト生成
    const generatePrompts = (configData: any) => {
        const prompts: PromptOutput[] = [];

        // Runwayプロンプト（各セクション用）
        configData.sections?.forEach((section: any, index: number) => {
            // 映像が必要なセクションのみ
            if (['story', 'fact', 'comparison', 'title', 'character'].includes(section.type)) {
                prompts.push({
                    type: 'runway',
                    label: `シーン ${index + 1}: ${section.type}`,
                    prompt: runwayPromptTemplate(section, index),
                    section: index,
                });
            }
        });

        // Sunoプロンプト（BGM用）
        const bgmTemplate = sunoPromptTemplates[bgmStyle];
        prompts.push({
            type: 'suno',
            label: 'BGM（60秒ループ）',
            prompt: `Create a ${bgmTemplate.mood} ${bgmTemplate.style} track with ${bgmTemplate.instruments}. 
${bgmTemplate.structure}
${bgmTemplate.tempo}
${bgmTemplate.vocal}
Duration: 60 seconds, loop-friendly ending.`,
        });

        // 効果音用
        prompts.push({
            type: 'suno',
            label: 'クイズ効果音',
            prompt: `[SFX] Quiz show sound effect. Suspenseful buildup, then triumphant correct answer reveal. 5 seconds. Electronic, playful.`,
        });

        // TTSテキスト（キャラクター別）
        const senseiDialogues: string[] = [];
        const studentDialogues: string[] = [];

        configData.sections?.forEach((section: any) => {
            if (section.type === 'dialogue') {
                section.dialogues?.forEach((d: any) => {
                    if (d.characterId === 'sensei') {
                        senseiDialogues.push(d.text);
                    } else if (d.characterId === 'student') {
                        studentDialogues.push(d.text);
                    }
                });
            }
            if (section.type === 'story' && section.narration) {
                senseiDialogues.push(section.narration);
            }
            if (section.type === 'character' && section.introText) {
                if (section.characterId === 'sensei') {
                    senseiDialogues.push(section.introText);
                }
            }
        });

        if (senseiDialogues.length > 0) {
            prompts.push({
                type: 'tts',
                label: `先生のセリフ (${selectedVoiceSensei})`,
                prompt: senseiDialogues.join('\n\n---\n\n'),
            });
        }

        if (studentDialogues.length > 0) {
            prompts.push({
                type: 'tts',
                label: `生徒のセリフ (${selectedVoiceStudent})`,
                prompt: studentDialogues.join('\n\n---\n\n'),
            });
        }

        setOutputs(prompts);
    };

    // クリップボードにコピー
    const handleCopy = (prompt: string, index: number) => {
        navigator.clipboard.writeText(prompt);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast.success('コピーしました');
    };

    // セクション展開切り替え
    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    // 設定変更時に再生成
    useEffect(() => {
        if (config) {
            generatePrompts(config);
        }
    }, [selectedVoiceSensei, selectedVoiceStudent, bgmStyle]);

    const runwayPrompts = outputs.filter(o => o.type === 'runway');
    const sunoPrompts = outputs.filter(o => o.type === 'suno');
    const ttsPrompts = outputs.filter(o => o.type === 'tts');

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* ヘッダー */}
            <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Zap className="h-6 w-6 text-yellow-400" />
                                AIプロンプト生成
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                レシピからRunway・Suno・TTSのプロンプトを自動生成
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* ファイルアップロード */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-400" />
                        レシピファイルを読み込む
                    </h2>
                    <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-700 bg-gray-950 px-4 py-8 cursor-pointer hover:border-blue-500/60 transition-colors">
                        <Film className="h-6 w-6 text-gray-400" />
                        <span className="text-gray-400">JSONファイルをドロップまたはクリック</span>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                    {config && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
                            ✅ 読み込み済み: {config.title} ({config.sections?.length || 0}シーン)
                        </div>
                    )}
                </div>

                {/* 設定パネル */}
                {config && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                        <h2 className="text-lg font-semibold mb-4">⚙️ 生成設定</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* BGMスタイル */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">BGMスタイル (Suno)</label>
                                <select
                                    value={bgmStyle}
                                    onChange={(e) => setBgmStyle(e.target.value as keyof typeof sunoPromptTemplates)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    <option value="educational">🎓 教育系（落ち着いた）</option>
                                    <option value="dramatic">🎬 ドラマチック</option>
                                    <option value="quiz">🎮 クイズ系（楽しい）</option>
                                </select>
                            </div>

                            {/* 先生ボイス */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">先生ボイス (TTS)</label>
                                <select
                                    value={selectedVoiceSensei}
                                    onChange={(e) => setSelectedVoiceSensei(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {ttsVoices.map(v => (
                                        <option key={v.id} value={v.id}>{v.name} - {v.desc}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 生徒ボイス */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">生徒ボイス (TTS)</label>
                                <select
                                    value={selectedVoiceStudent}
                                    onChange={(e) => setSelectedVoiceStudent(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {ttsVoices.map(v => (
                                        <option key={v.id} value={v.id}>{v.name} - {v.desc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* 出力セクション */}
                {outputs.length > 0 && (
                    <div className="space-y-6">
                        {/* Runway Gen4/4.5 */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('runway')}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-violet-500/20 rounded-lg">
                                        <Video className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Runway Gen4/4.5</h3>
                                        <p className="text-sm text-gray-400">映像・画像・SFX用プロンプト ({runwayPrompts.length}件)</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded">Unlimited</span>
                                </div>
                                {expandedSections.has('runway') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                            {expandedSections.has('runway') && (
                                <div className="px-6 pb-6 space-y-4">
                                    {runwayPrompts.map((p, i) => (
                                        <div key={i} className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-violet-300">{p.label}</span>
                                                <button
                                                    onClick={() => handleCopy(p.prompt, outputs.indexOf(p))}
                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
                                                >
                                                    {copiedIndex === outputs.indexOf(p) ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                                    コピー
                                                </button>
                                            </div>
                                            <pre className="bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                                                {p.prompt}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Suno AI */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('suno')}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <Music className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Suno AI</h3>
                                        <p className="text-sm text-gray-400">BGM・効果音用プロンプト ({sunoPrompts.length}件)</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">Premier</span>
                                </div>
                                {expandedSections.has('suno') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                            {expandedSections.has('suno') && (
                                <div className="px-6 pb-6 space-y-4">
                                    {sunoPrompts.map((p, i) => (
                                        <div key={i} className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-emerald-300">{p.label}</span>
                                                <button
                                                    onClick={() => handleCopy(p.prompt, outputs.indexOf(p))}
                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
                                                >
                                                    {copiedIndex === outputs.indexOf(p) ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                                    コピー
                                                </button>
                                            </div>
                                            <pre className="bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                                                {p.prompt}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Google AI Studio TTS */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('tts')}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Mic className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Google AI Studio TTS</h3>
                                        <p className="text-sm text-gray-400">音声合成用テキスト ({ttsPrompts.length}件)</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">日本語対応</span>
                                </div>
                                {expandedSections.has('tts') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                            {expandedSections.has('tts') && (
                                <div className="px-6 pb-6 space-y-4">
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300 mb-4">
                                        💡 Google AI Studioで上記のボイス（{selectedVoiceSensei}, {selectedVoiceStudent}）を選択してテキストを入力してください
                                    </div>
                                    {ttsPrompts.map((p, i) => (
                                        <div key={i} className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-blue-300">{p.label}</span>
                                                <button
                                                    onClick={() => handleCopy(p.prompt, outputs.indexOf(p))}
                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
                                                >
                                                    {copiedIndex === outputs.indexOf(p) ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                                    コピー
                                                </button>
                                            </div>
                                            <pre className="bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                                                {p.prompt}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 空の状態 */}
                {outputs.length === 0 && !config && (
                    <div className="text-center py-20">
                        <Sparkles className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            プロンプトを生成しましょう
                        </h3>
                        <p className="text-gray-500">
                            Shorts Makerで作成したレシピファイル（JSON）をアップロードしてください
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
