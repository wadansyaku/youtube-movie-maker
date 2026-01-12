'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Player, Thumbnail, type PlayerRef } from '@remotion/player';
import { MedicalShorts } from '@/remotion/MedicalShorts';
import { VideoConfig, Section, AudioPlan } from '@/remotion/types/video';
import {
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    Download,
    Sparkles,
    Copy,
    Loader2,
    Brain,
    Lightbulb,
    HelpCircle,
    Timer,
    Plus,
    Trash2,
    GripVertical,
    Music,
    Mic,
    Star,
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { type AiShortDraft } from '@/lib/ai-short-draft';
import AssetPickerModal from '@/components/asset/AssetPickerModal';

type TemplatePacingRule = {
    cutsPer10s: number;
    targetDurationSec: number;
    lineLength: number;
    maxLines: number;
};

type TemplateAudioDefaults = {
    ttsPrompt: string;
    bgmPrompt: string;
    sfxNotes: string;
};

type TemplateAudioHints = {
    bgmKeywords?: string[];
    sfxKeywords?: string[];
    narrationKeywords?: string[];
};

type Draftify<T> = T extends any
    ? Omit<T, 'startSec' | 'endSec'> & { startSec?: number; endSec?: number }
    : never;

type DraftSection = Draftify<Section>;

type TemplateDefinition = {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    preview: {
        title: string;
        subtitle: string;
        gradient: string;
    };
    sceneCount: number;
    themeId: 'medical-dark' | 'medical-light' | 'pop-quiz';
    themeLabel: string;
    defaultSections: DraftSection[];
    characters?: { id: string; name: string; color: string }[];
    rules: TemplatePacingRule;
    audioDefaults: TemplateAudioDefaults;
    audioHints?: TemplateAudioHints;
};

type TimelineResult = {
    sections: Section[];
    duration: number;
    target?: number;
};

// テンプレート定義
const templates: TemplateDefinition[] = [
    {
        id: 'optimized-explain',
        name: 'バズ構成・解説',
        icon: <Sparkles className="h-8 w-8" />,
        description: '結論先出しで伸ばす短尺テンプレート',
        preview: {
            title: 'バズ構成',
            subtitle: '結論→理由→行動',
            gradient: 'from-cyan-400/30 via-slate-900 to-slate-950',
        },
        sceneCount: 8,
        themeId: 'medical-dark' as const,
        themeLabel: '🚀 バズ構成',
        defaultSections: [
            { type: 'title' as const, mainTitle: '結論だけ先出し', subtitle: '3秒で興味を奪う' },
            { type: 'hook' as const, onScreenText: '知らないと損。\nこの3秒で差がつく。' },
            { type: 'keypoint' as const, onScreenText: 'ポイント1: 結論→理由→行動' },
            { type: 'fact' as const, number: '3', unit: '秒', description: '冒頭3秒で離脱が決まる' },
            { type: 'comparison' as const, leftLabel: '伸びない', leftContent: '説明が長い', rightLabel: '伸びる', rightContent: '結論→根拠→行動' },
            { type: 'keypoint' as const, onScreenText: 'ポイント2: 1行1メッセージ' },
            { type: 'recap' as const, onScreenText: '今日の型', points: ['結論を先に', '短く区切る', '行動を促す'] },
            { type: 'conclusion' as const, onScreenText: '続きはフォローで。 "保存"も推奨', ctaText: '保存して見返す' },
        ],
        rules: {
            cutsPer10s: 2.7,
            targetDurationSec: 30,
            lineLength: 12,
            maxLines: 2,
        },
        audioDefaults: {
            ttsPrompt: '結論先出しでテンポ良く。強弱をはっきり。',
            bgmPrompt: 'アップテンポで清潔感のあるポップ/エレクトロ。ボーカルなし。',
            sfxNotes: 'フック=pop、強調=whoosh、まとめ=chime',
        },
        audioHints: {
            bgmKeywords: ['pop', 'electro', 'upbeat'],
            sfxKeywords: ['pop', 'whoosh', 'chime'],
        },
    },
    {
        id: 'brain-facts',
        name: '脳科学トリビア',
        icon: <Brain className="h-8 w-8" />,
        description: '脳に関する驚きの事実を紹介',
        preview: {
            title: '脳のトリビア',
            subtitle: '1分で学ぶ',
            gradient: 'from-indigo-500/30 via-slate-900 to-slate-950',
        },
        sceneCount: 5,
        themeId: 'medical-dark' as const,
        themeLabel: '🧠 脳科学の豆知識',
        defaultSections: [
            { type: 'hook' as const, onScreenText: '脳は1日に約○○回思考。\n知ってた？' },
            { type: 'keypoint' as const, onScreenText: '① 事実1: 驚きの数字を入れる' },
            { type: 'keypoint' as const, onScreenText: '② 事実2: 生活に関係する話' },
            { type: 'quiz' as const, question: '脳に関するクイズ', choices: ['A', 'B', 'C'], answer: 'B' },
            { type: 'conclusion' as const, onScreenText: '続きはフォローで\n毎日1分で学ぼう' },
        ],
        rules: {
            cutsPer10s: 2,
            targetDurationSec: 25,
            lineLength: 12,
            maxLines: 2,
        },
        audioDefaults: {
            ttsPrompt: '知的で落ち着いたトーン。ゆっくり明瞭に。',
            bgmPrompt: '知的で落ち着いたアンビエント。透明感のあるBGM。',
            sfxNotes: '数字提示=ping、クイズ=chime、切替=whoosh',
        },
        audioHints: {
            bgmKeywords: ['ambient', 'calm', 'science'],
            sfxKeywords: ['ping', 'chime', 'whoosh'],
        },
    },
    {
        id: 'medical-tips',
        name: '医学豆知識',
        icon: <Lightbulb className="h-8 w-8" />,
        description: '健康に関する役立つ情報',
        preview: {
            title: '医学の豆知識',
            subtitle: '今日から使える',
            gradient: 'from-emerald-500/30 via-slate-900 to-slate-950',
        },
        sceneCount: 4,
        themeId: 'medical-light' as const,
        themeLabel: '💊 医学の豆知識',
        defaultSections: [
            { type: 'hook' as const, onScreenText: '健康の9割は\n最初の1行で決まる。' },
            { type: 'keypoint' as const, onScreenText: '① 明日からできる習慣' },
            { type: 'keypoint' as const, onScreenText: '② やりがちなNG行動' },
            { type: 'conclusion' as const, onScreenText: '💡 今日から1つだけ実践' },
        ],
        rules: {
            cutsPer10s: 2,
            targetDurationSec: 20,
            lineLength: 12,
            maxLines: 2,
        },
        audioDefaults: {
            ttsPrompt: '信頼感のあるナレーション。落ち着きつつ親しみ。',
            bgmPrompt: 'クリーンで控えめなヘルスケア系BGM。ボーカルなし。',
            sfxNotes: '注意点=tick、まとめ=soft chime',
        },
        audioHints: {
            bgmKeywords: ['clean', 'soft', 'health'],
            sfxKeywords: ['tick', 'chime', 'soft'],
        },
    },
    {
        id: 'quiz-show',
        name: 'クイズ形式',
        icon: <HelpCircle className="h-8 w-8" />,
        description: '視聴者参加型のクイズ動画',
        preview: {
            title: 'クイズタイム',
            subtitle: 'コメントで回答',
            gradient: 'from-amber-400/30 via-slate-900 to-slate-950',
        },
        sceneCount: 4,
        themeId: 'pop-quiz' as const,
        themeLabel: '❓ クイズタイム',
        defaultSections: [
            { type: 'hook' as const, onScreenText: '今日のクイズ！\nコメントで答えて！' },
            { type: 'quiz' as const, question: 'クイズの質問を入力', choices: ['A', 'B', 'C'], answer: 'A' },
            { type: 'keypoint' as const, onScreenText: '解説：\n答えの根拠を1行で' },
            { type: 'conclusion' as const, onScreenText: '🎯 正解できた？\nまた次回！' },
        ],
        rules: {
            cutsPer10s: 2,
            targetDurationSec: 20,
            lineLength: 12,
            maxLines: 2,
        },
        audioDefaults: {
            ttsPrompt: '明るく参加型。テンポよく問いかけ。',
            bgmPrompt: 'ゲームショー風の軽快BGM。ボーカルなし。',
            sfxNotes: 'クイズ開始=pop、正解=chime、タイムアップ=whoosh',
        },
        audioHints: {
            bgmKeywords: ['quiz', 'game', 'upbeat'],
            sfxKeywords: ['pop', 'chime', 'timer'],
        },
    },
    {
        id: 'dialogue-20scene',
        name: '20シーン対話形式',
        icon: <Sparkles className="h-8 w-8" />,
        description: 'AIキャラクターが対話する本格動画',
        preview: {
            title: '先生×生徒',
            subtitle: 'テンポ対話',
            gradient: 'from-fuchsia-500/30 via-slate-900 to-slate-950',
        },
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
        rules: {
            cutsPer10s: 4,
            targetDurationSec: 50,
            lineLength: 12,
            maxLines: 2,
        },
        audioDefaults: {
            ttsPrompt: '掛け合いテンポ。感情の抑揚をつける。',
            bgmPrompt: '軽快で会話を邪魔しないBGM。ボーカルなし。',
            sfxNotes: 'ツッコミ=pop、切替=whoosh、正解=chime',
        },
        audioHints: {
            bgmKeywords: ['talk', 'light', 'upbeat'],
            sfxKeywords: ['pop', 'whoosh', 'chime'],
        },
    },
];

// ステップ定義
const steps = [
    { id: 1, name: 'テンプレートを選ぶ', description: '動画のスタイルを選択' },
    { id: 2, name: '内容を入力', description: 'テキストを編集' },
    { id: 3, name: 'プレビュー＆書き出し', description: '確認して完成' },
];

const defaultAudioPlan: AudioPlan = {
    ttsProvider: 'google-ai-studio',
    ttsPrompt: '',
    ttsText: '',
    ttsVoiceId: '',
    narrationPath: '',
    bgmProvider: 'suno',
    bgmPrompt: '',
    bgmAssetId: '',
    sfxProvider: 'local',
    sfxNotes: '',
};

const roundDuration = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(1, Math.round(value * 10) / 10);
};

const formatSec = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 10) / 10;
};

const getDefaultDuration = (section: DraftSection) => {
    switch (section.type) {
        case 'quiz':
            return 9;
        case 'hook':
            return 4;
        case 'title':
            return 2.5;
        case 'countdown':
            return 3;
        case 'transition':
            return 1.5;
        case 'dialogue':
            return 3.5;
        case 'story':
            return 4.5;
        case 'character':
            return 3.5;
        case 'fact':
            return 3.5;
        case 'comparison':
            return 4;
        case 'reveal':
            return 3;
        case 'recap':
            return 3.5;
        case 'conclusion':
            return 3.5;
        case 'keypoint':
        default:
            return 4;
    }
};

const getMinDuration = (section: DraftSection) => {
    switch (section.type) {
        case 'transition':
            return 1.2;
        case 'countdown':
        case 'title':
        case 'character':
            return 2;
        case 'hook':
        case 'reveal':
            return 2.5;
        case 'dialogue':
        case 'fact':
            return 2.8;
        case 'quiz':
            return 6.5;
        case 'story':
            return 4;
        case 'comparison':
            return 3.2;
        case 'conclusion':
        case 'recap':
            return 3;
        case 'keypoint':
        default:
            return 3.2;
    }
};

const getSectionDuration = (section: DraftSection) => {
    const diff = (section.endSec ?? 0) - (section.startSec ?? 0);
    if (Number.isFinite(diff) && diff > 0) {
        return roundDuration(diff);
    }
    return roundDuration(getDefaultDuration(section));
};

const rebuildTimeline = (sections: DraftSection[]): TimelineResult => {
    let currentTime = 0;
    const updated = sections.map((section) => {
        const duration = getSectionDuration(section);
        const startSec = currentTime;
        const endSec = roundDuration(currentTime + duration);
        currentTime = endSec;
        return { ...section, startSec, endSec } as Section;
    });
    return { sections: updated, duration: roundDuration(currentTime) };
};

const getTemplateTargetDuration = (
    sectionsCount: number,
    rules: TemplatePacingRule | null | undefined,
    fallback: number
) => {
    if (!rules) return fallback;
    if (Number.isFinite(rules.targetDurationSec)) {
        return Math.max(10, rules.targetDurationSec);
    }
    if (Number.isFinite(rules.cutsPer10s) && rules.cutsPer10s > 0) {
        return Math.max(10, roundDuration((sectionsCount / rules.cutsPer10s) * 10));
    }
    return fallback;
};

const autoPaceSections = (sections: DraftSection[], targetDurationSec: number): TimelineResult => {
    const target = Math.max(10, targetDurationSec);
    const minDurations = sections.map(getMinDuration);
    const minTotal = minDurations.reduce((sum, value) => sum + value, 0);
    if (target < minTotal) {
        const rebuilt = rebuildTimeline(sections);
        return { ...rebuilt, target: roundDuration(minTotal) };
    }

    const baseDurations = sections.map(getSectionDuration);
    const weights = sections.map((section, index) => {
        const base = baseDurations[index];
        if (section.type === 'quiz') return base * 1.4;
        if (section.type === 'hook') return base * 1.2;
        if (section.type === 'conclusion') return base * 0.9;
        if (section.type === 'story') return base * 1.15;
        return base;
    });
    const weightTotal = weights.reduce((sum, value) => sum + value, 0) || 1;
    const extra = target - minTotal;

    let currentTime = 0;
    const updated = sections.map((section, index) => {
        const min = minDurations[index];
        const isLast = index === sections.length - 1;
        const desired = min + extra * (weights[index] / weightTotal);
        const duration = isLast
            ? Math.max(min, roundDuration(target - currentTime))
            : roundDuration(Math.max(min, desired));
        const startSec = currentTime;
        const endSec = roundDuration(currentTime + duration);
        currentTime = endSec;
        return { ...section, startSec, endSec } as Section;
    });

    return { sections: updated, duration: roundDuration(currentTime), target };
};

export default function ShortsMakerView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get('draft');
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
    const [config, setConfig] = useState<VideoConfig | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [aiTheme, setAiTheme] = useState('');
    const [aiTone, setAiTone] = useState('');
    const [aiTitle, setAiTitle] = useState('');
    const [aiOutline, setAiOutline] = useState<string[]>([]);
    const [aiTags, setAiTags] = useState<string[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPackage, setAiPackage] = useState<any | null>(null);
    const [pendingDraft, setPendingDraft] = useState<AiShortDraft | null>(null);
    const [showDraftPrompt, setShowDraftPrompt] = useState(false);
    const [lineLength, setLineLength] = useState(12);
    const [maxLines, setMaxLines] = useState(2);
    const [targetDuration, setTargetDuration] = useState(60);
    const [renderJobId, setRenderJobId] = useState<string | null>(null);
    const [renderJob, setRenderJob] = useState<{
        id?: string;
        status?: 'queued' | 'rendering' | 'completed' | 'failed';
        progress?: number;
        message?: string;
        error?: string;
        assetId?: string;
    } | null>(null);
    const [assetPickerTarget, setAssetPickerTarget] = useState<{
        kind: 'narration' | 'bgm' | 'sfx';
        index?: number;
        search?: string;
    } | null>(null);
    const [hookSuggestions, setHookSuggestions] = useState<string[]>([]);
    const [hookLoading, setHookLoading] = useState(false);
    const [hookError, setHookError] = useState<string | null>(null);
    const previewPlayerRef = useRef<PlayerRef>(null);
    const [previewFrame, setPreviewFrame] = useState(0);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!draftId) return;
        let cancelled = false;
        const loadDraft = async () => {
            try {
                const res = await fetch(`/api/assets/${draftId}`);
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'AI下書きの読み込みに失敗しました');
                }
                const asset = await res.json();
                const rawParams = asset?.generationParams;
                const rawMetadata = asset?.metadata;
                const params = typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams;
                const metadata = typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : rawMetadata;
                if (!params || typeof params !== 'object' || !params.script) {
                    throw new Error('AI下書きの内容が見つかりません');
                }

                const draft: AiShortDraft = {
                    theme: params.theme || metadata?.theme || '',
                    tone: params.tone || metadata?.tone || '',
                    title: params.title || metadata?.title || '',
                    hook: params.hook || '',
                    outline: Array.isArray(params.outline) ? params.outline : [],
                    script: params.script || '',
                    tags: Array.isArray(params.tags) ? params.tags : [],
                    assets: Array.isArray(params.assets) ? params.assets : [],
                    closing: params.closing || '',
                    quiz: params.quiz || { question: '', choices: [], answer: '' },
                    createdAt: params.savedAt,
                };

                if (!cancelled) {
                    setPendingDraft(draft);
                    setShowDraftPrompt(true);
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error(error instanceof Error ? error.message : 'AI下書きの読み込みに失敗しました');
                }
            } finally {
            }
        };

        void loadDraft();
        return () => {
            cancelled = true;
        };
    }, [draftId]);

    useEffect(() => {
        if (!renderJobId) return;
        let cancelled = false;
        const pollStatus = async () => {
            try {
                const res = await fetch(`/api/remotion/render/${renderJobId}`);
                if (!res.ok) {
                    throw new Error('動画作成状況の取得に失敗しました');
                }
                const data = await res.json();
                if (cancelled) return;
                setRenderJob(data);
                if (data.status === 'completed') {
                    setRenderJobId(null);
                    toast.success('動画が保存されました');
                }
                if (data.status === 'failed') {
                    setRenderJobId(null);
                    toast.error('動画作成に失敗しました');
                }
            } catch (error) {
                if (cancelled) return;
                setRenderJob((prev) => ({
                    ...prev,
                    error: error instanceof Error ? error.message : '動画作成状況の取得に失敗しました',
                }));
            }
        };

        const interval = setInterval(pollStatus, 1500);
        void pollStatus();
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [renderJobId]);

    useEffect(() => {
        const player = previewPlayerRef.current;
        if (!player) return;
        const handleFrameUpdate = (event: { detail: { frame: number } }) => {
            setPreviewFrame(event.detail.frame);
        };
        player.addEventListener('frameupdate', handleFrameUpdate);
        return () => {
            player.removeEventListener('frameupdate', handleFrameUpdate);
        };
    }, [config?.duration]);

    const applyTimeline = (sections: Section[]) => {
        if (!config) return;
        const rules = selectedTemplate?.rules ?? null;
        const target = getTemplateTargetDuration(sections.length, rules, targetDuration);
        const result = rules ? autoPaceSections(sections, target) : rebuildTimeline(sections);
        setConfig({ ...config, sections: result.sections, duration: result.duration });
        if (rules) {
            setTargetDuration(Math.round(result.target ?? result.duration));
        }
    };

    const getPathLabel = (value: string) => {
        if (!value) return '';
        const parts = value.split('/');
        return parts[parts.length - 1] || value;
    };

    const updateAudioPlan = (updates: Partial<AudioPlan>, configUpdates: Partial<VideoConfig> = {}) => {
        if (!config) return;
        const nextPlan: AudioPlan = {
            ...defaultAudioPlan,
            ...config.audioPlan,
            ...updates,
        };
        setConfig({
            ...config,
            ...configUpdates,
            audioPlan: nextPlan,
        });
    };

    const openAssetPicker = (target: { kind: 'narration' | 'bgm' | 'sfx'; index?: number; search?: string }) => {
        setAssetPickerTarget(target);
    };

    const handleAssetPicked = (asset: { id: string; filePath: string; fileName: string }) => {
        if (!config || !asset?.filePath) {
            toast.error('ファイルパスが見つかりません');
            return;
        }

        if (!assetPickerTarget) return;

        if (assetPickerTarget.kind === 'narration') {
            updateAudioPlan({ narrationPath: asset.filePath }, { narration: asset.filePath });
        }

        if (assetPickerTarget.kind === 'bgm') {
            updateAudioPlan({ bgmAssetId: asset.id }, { bgm: asset.filePath });
        }

        if (assetPickerTarget.kind === 'sfx' && typeof assetPickerTarget.index === 'number') {
            updateSection(assetPickerTarget.index, { soundEffect: asset.filePath } as any);
        }

        setAssetPickerTarget(null);
        toast.success(`${asset.fileName} を挿入しました`);
    };

    // テンプレート選択時
    const handleSelectTemplate = (template: typeof templates[0]) => {
        setSelectedTemplate(template);
        setLineLength(template.rules?.lineLength ?? lineLength);
        setMaxLines(template.rules?.maxLines ?? maxLines);

        // セクションにタイミングを追加
        // 20シーンテンプレートは1シーン3秒（合計60秒）
        const is20Scene = template.id === 'dialogue-20scene';
        let currentTime = 0;
        const sectionsWithTiming: Section[] = template.defaultSections.map((section) => {
            // 20シーンは3秒固定、それ以外は従来のロジック
            const duration = is20Scene
                ? 3
                : getDefaultDuration(section);
            const result = {
                ...section,
                startSec: currentTime,
                endSec: roundDuration(currentTime + duration),
            } as Section;
            currentTime = result.endSec;
            return result;
        });

        const baseDuration = roundDuration(currentTime);
        const target = getTemplateTargetDuration(sectionsWithTiming.length, template.rules, baseDuration);
        const paced = template.rules ? autoPaceSections(sectionsWithTiming, target) : rebuildTimeline(sectionsWithTiming);
        const totalDuration = paced.duration;

        setConfig({
            title: `${template.name}動画`,
            themeLabel: template.themeLabel,
            themeId: template.themeId,
            duration: totalDuration,
            sections: paced.sections,
            characters: 'characters' in template ? template.characters : undefined,
            bgmVolume: 0.12,
            audioPlan: {
                ...defaultAudioPlan,
                ttsPrompt: template.audioDefaults?.ttsPrompt || '',
                bgmPrompt: template.audioDefaults?.bgmPrompt || `${template.name}に合うBGM`,
                sfxNotes: template.audioDefaults?.sfxNotes || '',
            },
            disclaimer: '※ 内容は概算・参考情報です',
        });
        setTargetDuration(Math.round(paced.target ?? totalDuration));

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
        if (selectedTemplate?.rules) {
            toast.error('テンプレのカット数は固定です');
            return;
        }
        const newSections = config.sections.filter((_, i) => i !== index);
        applyTimeline(newSections);
    };

    // セクション追加
    const addSection = (type: 'keypoint' | 'quiz') => {
        if (selectedTemplate?.rules) {
            toast.error('テンプレのカット数は固定です');
            return;
        }
        if (!config) return;
        const newSectionBase: Section = type === 'quiz'
            ? {
                type: 'quiz',
                startSec: 0,
                endSec: 0,
                question: '新しいクイズ',
                choices: ['選択肢A', '選択肢B', '選択肢C'],
                answer: '選択肢A'
            }
            : {
                type: 'keypoint',
                startSec: 0,
                endSec: 0,
                onScreenText: '新しいポイント'
            };

        const duration = getDefaultDuration(newSectionBase);
        const newSection: Section = {
            ...newSectionBase,
            startSec: 0,
            endSec: duration,
        };

        // 結論の前に挿入
        const conclusionIndex = config.sections.findIndex(s => s.type === 'conclusion');
        const insertIndex = conclusionIndex >= 0 ? conclusionIndex : config.sections.length;

        const newSections = [
            ...config.sections.slice(0, insertIndex),
            newSection,
            ...config.sections.slice(insertIndex)
        ];

        applyTimeline(newSections);
        toast.success('セクションを追加しました');
    };

    const setSectionDuration = (index: number, value: number) => {
        if (!config) return;
        if (selectedTemplate?.rules) {
            toast.error('テンプレの尺ルールが固定されています');
            return;
        }
        const current = config.sections[index];
        const nextDuration = roundDuration(Math.max(getMinDuration(current), value));
        const newSections = [...config.sections];
        newSections[index] = {
            ...current,
            startSec: current.startSec,
            endSec: current.startSec + nextDuration,
        } as Section;
        applyTimeline(newSections);
    };

    const moveSection = (index: number, direction: -1 | 1) => {
        if (!config) return;
        const section = config.sections[index];
        if (section.type === 'hook' || section.type === 'conclusion') return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= config.sections.length) return;
        const targetSection = config.sections[targetIndex];
        if (targetSection.type === 'hook' || targetSection.type === 'conclusion') return;
        const newSections = [...config.sections];
        const [moved] = newSections.splice(index, 1);
        newSections.splice(targetIndex, 0, moved);
        applyTimeline(newSections);
    };

    const handleAutoPace = () => {
        if (!config) return;
        const rules = selectedTemplate?.rules ?? null;
        const target = getTemplateTargetDuration(config.sections.length, rules, targetDuration);
        const minTotal = config.sections.map(getMinDuration).reduce((sum, value) => sum + value, 0);
        if (target < minTotal) {
            toast.error(`最短でも${formatSec(minTotal)}秒は必要です`);
            return;
        }

        const result = autoPaceSections(config.sections, target);
        setConfig({ ...config, sections: result.sections, duration: result.duration });
        setTargetDuration(Math.round(result.target ?? result.duration));
        toast.success('テンポを再調整しました');
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
        toast.success('下書きを保存しました');
    };

    const handleRenderVideo = async () => {
        const isActive = renderJob?.status === 'rendering' || renderJob?.status === 'queued';
        if (!config || isActive) return;
        setRenderJob({ status: 'queued', progress: 0, message: '準備中' });

        try {
            const res = await fetch('/api/remotion/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || '動画作成を開始できませんでした');
            }

            const data = await res.json();
            setRenderJobId(data.jobId);
            setRenderJob({ id: data.jobId, status: 'rendering', progress: 0, message: '準備中' });
            toast.success('動画作成を開始しました');
        } catch (error) {
            setRenderJob({
                status: 'failed',
                progress: 0,
                error: error instanceof Error ? error.message : '動画作成に失敗しました',
            });
            toast.error(error instanceof Error ? error.message : '動画作成に失敗しました');
        }
    };

    const applyAiPackageToConfig = (data: any) => {
        if (!config) return;
        const outlineQueue = Array.isArray(data?.outline) ? [...data.outline] : [];
        const script: string = typeof data?.script === 'string' ? data.script : '';
        const fallbackTitle = (data?.title || config.title || '').toString();
        const takeOutline = (fallback: string) => {
            const next = outlineQueue.shift();
            return next ? next : fallback;
        };
        const scriptSnippet = (() => {
            if (!script) return '';
            const first = script.split(/[。.\n]/).map(line => line.trim()).filter(Boolean)[0];
            return first || script.slice(0, 40);
        })();

        const extractFact = (text: string) => {
            const match = /([0-9]+(?:[.,][0-9]+)*)\s*([^\s%0-9]+|%|回|年|人|個|倍)?/.exec(text);
            if (match) {
                return { number: match[1], unit: match[2] || '' };
            }
            return { number: '1', unit: '' };
        };

        const characters = config.characters ?? [];
        const getCharacterId = (index: number, fallback?: string) => {
            if (characters.length === 0) return fallback || 'speaker';
            return characters[index % characters.length].id;
        };

        const updatedSections = config.sections.map((section) => {
            switch (section.type) {
                case 'title':
                    return {
                        ...section,
                        mainTitle: formatShortText(data?.title || section.mainTitle, Math.min(lineLength, 12)),
                        subtitle: section.subtitle || formatShortText(aiTheme || data?.tone || 'ショート解説', lineLength),
                    } as Section;
                case 'hook':
                    return { ...section, onScreenText: formatShortText(data?.hook || section.onScreenText) } as Section;
                case 'keypoint':
                    return { ...section, onScreenText: formatShortText(takeOutline(section.onScreenText || 'ポイント')) } as Section;
                case 'quiz':
                    if (!data?.quiz) return section;
                    return {
                        ...section,
                        question: formatShortText(data.quiz.question || section.question),
                        choices: (data.quiz.choices || section.choices).map((choice: string) => cleanInlineText(choice)),
                        answer: cleanInlineText(data.quiz.answer || section.answer),
                    } as Section;
                case 'recap':
                    return {
                        ...section,
                        onScreenText: formatShortText(section.onScreenText || '今日のまとめ'),
                        points: (data?.outline || section.points || []).slice(0, 3).map((point: string) => formatShortText(point, lineLength)),
                    } as Section;
                case 'conclusion':
                    return { ...section, onScreenText: formatShortText(data?.closing || section.onScreenText) } as Section;
                case 'story':
                    return {
                        ...section,
                        narration: formatShortText(takeOutline(section.narration || scriptSnippet || data?.hook || '')),
                    } as Section;
                case 'character':
                    return {
                        ...section,
                        introText: formatShortText(takeOutline(section.introText || data?.hook || '')),
                    } as Section;
                case 'dialogue': {
                    const baseDialogues = section.dialogues?.length ? section.dialogues : [{ characterId: getCharacterId(0), text: '' }];
                    const nextDialogues = baseDialogues.map((dialogue, idx) => ({
                        ...dialogue,
                        characterId: dialogue.characterId || getCharacterId(idx, dialogue.characterId),
                        text: formatShortText(takeOutline(dialogue.text || scriptSnippet || data?.hook || '')),
                    }));
                    return { ...section, dialogues: nextDialogues } as Section;
                }
                case 'fact': {
                    const description = formatShortText(takeOutline(section.description || data?.hook || ''));
                    const fact = extractFact(description);
                    return {
                        ...section,
                        number: section.number || fact.number,
                        unit: section.unit || fact.unit,
                        description,
                    } as Section;
                }
                case 'comparison': {
                    const leftContent = formatShortText(takeOutline(section.leftContent || '従来のやり方'));
                    const rightContent = formatShortText(takeOutline(section.rightContent || '改善後のやり方'));
                    return {
                        ...section,
                        leftLabel: section.leftLabel || '知らないと',
                        rightLabel: section.rightLabel || '知ると',
                        leftContent,
                        rightContent,
                    } as Section;
                }
                case 'transition':
                    return {
                        ...section,
                        transitionText: formatShortText(section.transitionText || data?.title || 'ここからが本題'),
                    } as Section;
                case 'reveal':
                    return {
                        ...section,
                        buildup: formatShortText(section.buildup || data?.hook || ''),
                        revealText: formatShortText(section.revealText || data?.closing || 'まとめへ'),
                    } as Section;
                case 'countdown':
                    return {
                        ...section,
                        label: cleanInlineText(section.label || data?.title || '考えてみよう'),
                    } as Section;
                default:
                    return section;
            }
        });

        const nextAudioPlan: AudioPlan = {
            ...defaultAudioPlan,
            ...config.audioPlan,
        };
        if (!nextAudioPlan.ttsText?.trim() && script) {
            nextAudioPlan.ttsText = script;
        }
        if (!nextAudioPlan.bgmPrompt?.trim()) {
            nextAudioPlan.bgmPrompt = `${fallbackTitle}に合うBGM`;
        }

        setConfig({
            ...config,
            title: fallbackTitle || config.title,
            sections: updatedSections,
            audioPlan: nextAudioPlan,
        });
    };

    const handleAIGenerate = async () => {
        if (!aiTheme.trim()) {
            toast.error('テーマを入力してください');
            return;
        }
        setAiLoading(true);
        try {
            const res = await fetch('/api/ai/shorts/package', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: aiTheme,
                    title: aiTitle || config?.title,
                    tone: aiTone,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'AI生成に失敗しました');
            }

            const data = await res.json();
            setAiPackage(data);
            setAiOutline(data.outline || []);
            setAiTags(data.tags || []);
            setAiTitle(data.title || aiTitle);
            setAiTone(data.tone || aiTone);
            applyAiPackageToConfig(data);
            toast.success('AI内容を生成して反映しました');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'AI生成に失敗しました');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAIApply = () => {
        if (!config || !aiPackage) return;
        applyAiPackageToConfig(aiPackage);
        toast.success('AI内容を再反映しました');
    };

    const handleGenerateHookSuggestions = async (hookType?: string) => {
        if (hookLoading) return;
        const baseTheme = aiTheme.trim() || aiTitle.trim() || config?.title || '';
        if (!baseTheme) {
            toast.error('テーマを入力してください');
            return;
        }
        setHookLoading(true);
        setHookError(null);
        try {
            const res = await fetch('/api/ai/shorts/hooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: baseTheme,
                    tone: aiTone,
                    hookType,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'フック案の生成に失敗しました');
            }

            const data = await res.json();
            const hooks = Array.isArray(data.hooks) ? data.hooks : [];
            setHookSuggestions(hooks);
            if (hooks.length > 0) {
                toast.success('フック案を更新しました');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'フック案の生成に失敗しました';
            setHookError(message);
            toast.error(message);
        } finally {
            setHookLoading(false);
        }
    };

    const handleCopyTags = async () => {
        if (aiTags.length === 0) return;
        await copyText(aiTags.join(', '), 'タグをコピーしました');
    };

    const handleLoadDraft = () => {
        if (!pendingDraft) return;
        setAiTheme(pendingDraft.theme || '');
        setAiTone(pendingDraft.tone || '');
        setAiTitle(pendingDraft.title || '');
        setAiOutline(pendingDraft.outline || []);
        setAiTags(pendingDraft.tags || []);
        setAiPackage(pendingDraft);
        setShowDraftPrompt(false);
        if (draftId) {
            router.replace('/studio');
        }
        toast.success('AI下書きを読み込みました');
    };

    const handleDismissDraft = () => {
        setPendingDraft(null);
        setShowDraftPrompt(false);
        if (draftId) {
            router.replace('/studio');
        }
        toast.success('AI下書きを破棄しました');
    };

    const normalizeText = (value: string) => {
        return value
            .replace(/\r\n/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{2,}/g, '\n')
            .trim();
    };

    const wrapText = (value: string, maxChars: number, maxLineCount = maxLines) => {
        const normalized = normalizeText(value);
        if (!normalized) return '';
        const rawLines = normalized.split('\n').map(line => line.trim()).filter(Boolean);
        const wrapped: string[] = [];
        rawLines.forEach((line) => {
            const chars = Array.from(line);
            while (chars.length > 0) {
                wrapped.push(chars.splice(0, maxChars).join(''));
            }
        });
        if (maxLineCount <= 0) {
            return wrapped.join('\n');
        }
        if (wrapped.length <= maxLineCount) {
            return wrapped.join('\n');
        }
        const limited = wrapped.slice(0, maxLineCount);
        const suffix = '...';
        const lastIndex = maxLineCount - 1;
        const lastChars = Array.from(limited[lastIndex]);
        const trimmedLength = Math.max(0, maxChars - suffix.length);
        limited[lastIndex] = `${lastChars.slice(0, trimmedLength).join('')}${suffix}`;
        return limited.join('\n');
    };

    const formatShortText = (value: string, maxChars = lineLength) => {
        return wrapText(value, maxChars, maxLines);
    };

    const cleanInlineText = (value: string) => {
        return normalizeText(value).replace(/\n+/g, ' ');
    };

    const countWrappedLines = (value: string, maxChars = lineLength) => {
        const normalized = normalizeText(value);
        if (!normalized) return 0;
        const rawLines = normalized.split('\n').map(line => line.trim()).filter(Boolean);
        return rawLines.reduce((sum, line) => {
            const length = Array.from(line).length;
            return sum + Math.max(1, Math.ceil(length / Math.max(1, maxChars)));
        }, 0);
    };

    const buildTtsTextFromSections = (sections: Section[]) => {
        const lines: string[] = [];
        sections.forEach((section) => {
            switch (section.type) {
                case 'title':
                    if (section.mainTitle) lines.push(section.mainTitle);
                    if (section.subtitle) lines.push(section.subtitle);
                    break;
                case 'hook':
                case 'keypoint':
                case 'conclusion':
                    if (section.onScreenText) lines.push(section.onScreenText);
                    break;
                case 'quiz':
                    lines.push(`クイズです。${section.question}`);
                    lines.push(`答えは${section.answer}`);
                    break;
                case 'recap':
                    if (section.onScreenText) lines.push(section.onScreenText);
                    if (section.points?.length) lines.push(section.points.join('、'));
                    break;
                case 'story':
                    if (section.narration) lines.push(section.narration);
                    break;
                case 'dialogue':
                    section.dialogues.forEach((dialogue) => {
                        if (dialogue.text) lines.push(dialogue.text);
                    });
                    break;
                case 'fact':
                    lines.push(`${section.number}${section.unit || ''}。${section.description}`);
                    break;
                case 'comparison':
                    lines.push(`${section.leftLabel}は${section.leftContent}`);
                    lines.push(`${section.rightLabel}は${section.rightContent}`);
                    break;
                case 'transition':
                    if (section.transitionText) lines.push(section.transitionText);
                    break;
                case 'reveal':
                    if (section.buildup) lines.push(section.buildup);
                    lines.push(section.revealText);
                    break;
                case 'countdown':
                    if (section.label) lines.push(section.label);
                    break;
                case 'character':
                    if (section.introText) lines.push(section.introText);
                    break;
                default:
                    break;
            }
        });
        return normalizeText(lines.join('\n'));
    };

    const copyText = async (value: string, message: string) => {
        if (!value.trim()) {
            toast.error('コピーする内容がありません');
            return;
        }
        try {
            await navigator.clipboard.writeText(value);
            toast.success(message);
        } catch {
            toast.error('コピーに失敗しました');
        }
    };

    const downloadTextFile = (fileName: string, content: string) => {
        if (!content.trim()) {
            toast.error('ダウンロードする内容がありません');
            return;
        }
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('テキストをダウンロードしました');
    };

    const polishSection = (section: Section): Section => {
        switch (section.type) {
            case 'hook':
            case 'conclusion':
            case 'keypoint':
                return { ...section, onScreenText: formatShortText(section.onScreenText) } as Section;
            case 'recap':
                return {
                    ...section,
                    onScreenText: formatShortText(section.onScreenText),
                    points: section.points?.map(point => formatShortText(point, lineLength)),
                } as Section;
            case 'quiz':
                return {
                    ...section,
                    question: formatShortText(section.question),
                    choices: section.choices.map(choice => cleanInlineText(choice)),
                    answer: cleanInlineText(section.answer),
                } as Section;
            case 'title':
                return {
                    ...section,
                    mainTitle: formatShortText(section.mainTitle, Math.min(lineLength, 12)),
                    subtitle: section.subtitle ? formatShortText(section.subtitle, lineLength) : section.subtitle,
                } as Section;
            case 'story':
                return {
                    ...section,
                    narration: formatShortText(section.narration, lineLength),
                    visualDescription: section.visualDescription
                        ? formatShortText(section.visualDescription, lineLength)
                        : section.visualDescription,
                } as Section;
            case 'character':
                return {
                    ...section,
                    introText: formatShortText(section.introText, lineLength),
                } as Section;
            case 'dialogue':
                return {
                    ...section,
                    dialogues: section.dialogues.map(dialogue => ({
                        ...dialogue,
                        text: formatShortText(dialogue.text, lineLength),
                    })),
                } as Section;
            case 'fact':
                return {
                    ...section,
                    description: formatShortText(section.description, lineLength),
                    number: cleanInlineText(section.number),
                    unit: section.unit ? cleanInlineText(section.unit) : section.unit,
                } as Section;
            case 'comparison':
                return {
                    ...section,
                    leftLabel: cleanInlineText(section.leftLabel),
                    rightLabel: cleanInlineText(section.rightLabel),
                    leftContent: formatShortText(section.leftContent, lineLength),
                    rightContent: formatShortText(section.rightContent, lineLength),
                } as Section;
            case 'transition':
                return {
                    ...section,
                    transitionText: section.transitionText
                        ? formatShortText(section.transitionText, lineLength)
                        : section.transitionText,
                } as Section;
            case 'reveal':
                return {
                    ...section,
                    revealText: formatShortText(section.revealText, lineLength),
                    buildup: section.buildup ? formatShortText(section.buildup, lineLength) : section.buildup,
                } as Section;
            case 'countdown':
                return {
                    ...section,
                    label: section.label ? cleanInlineText(section.label) : section.label,
                } as Section;
            default:
                return section;
        }
    };

    const handlePolishText = () => {
        if (!config) return;
        const updated = config.sections.map(polishSection);
        setConfig({ ...config, sections: updated });
        toast.success('テキストを整形しました');
    };

    const handleBuildTtsText = () => {
        if (!config) return;
        const text = buildTtsTextFromSections(config.sections);
        updateAudioPlan({ ttsText: text });
        toast.success('TTS用テキストを生成しました');
    };

    const qualityWarnings = useMemo(() => {
        if (!config) return [];
        const warnings: string[] = [];

        if (config.duration > 60) warnings.push('合計尺が60秒を超えています');
        if (config.duration < 15) warnings.push('合計尺が15秒未満です');
        if (!config.sections.some(section => section.type === 'hook')) warnings.push('フックがありません');
        if (!config.sections.some(section => section.type === 'conclusion')) warnings.push('結論・CTAがありません');
        if (Math.abs(config.duration - targetDuration) > 3) {
            warnings.push(`目標尺との差が${formatSec(Math.abs(config.duration - targetDuration))}秒あります`);
        }
        const cutRate = config.duration > 0 ? config.sections.length / (config.duration / 10) : 0;
        if (cutRate > 0 && (cutRate < 2 || cutRate > 4)) {
            warnings.push(`カット密度が${cutRate.toFixed(1)} cuts/10sです`);
        }

        const longSections = config.sections
            .map((section) => {
                const text = (() => {
                    switch (section.type) {
                        case 'hook':
                        case 'conclusion':
                        case 'keypoint':
                        case 'recap':
                            return section.onScreenText;
                        case 'quiz':
                            return [section.question, ...section.choices, section.answer].join('');
                        case 'title':
                            return [section.mainTitle, section.subtitle || ''].join('');
                        case 'story':
                            return [section.narration, section.visualDescription || ''].join('');
                        case 'character':
                            return section.introText;
                        case 'dialogue':
                            return section.dialogues.map(d => d.text).join('');
                        case 'fact':
                            return `${section.number}${section.unit || ''}${section.description}`;
                        case 'comparison':
                            return `${section.leftLabel}${section.leftContent}${section.rightLabel}${section.rightContent}`;
                        case 'transition':
                            return section.transitionText || '';
                        case 'reveal':
                            return `${section.buildup || ''}${section.revealText}`;
                        case 'countdown':
                            return section.label || '';
                        default:
                            return '';
                    }
                })();
                return { type: section.type, lineCount: countWrappedLines(text, lineLength) };
            })
            .filter((entry) => entry.lineCount > maxLines);

        if (longSections.length > 0) {
            warnings.push(`長文セクションが${longSections.length}件あります`);
        }

        const shortSections = config.sections.filter(section => getSectionDuration(section) < getMinDuration(section));
        if (shortSections.length > 0) {
            warnings.push(`短すぎるセクションが${shortSections.length}件あります`);
        }

        return warnings;
    }, [config, lineLength, maxLines, targetDuration]);

    // セクションタイプの日本語名
    const getSectionTypeName = (type: string) => {
        const names: Record<string, string> = {
            title: '🏷️ タイトル',
            hook: '🎣 フック（つかみ）',
            keypoint: '💡 ポイント',
            quiz: '❓ クイズ',
            dialogue: '💬 対話',
            story: '📖 ストーリー',
            character: '🧑‍🏫 キャラ紹介',
            fact: '📊 ファクト',
            comparison: '⚖️ 比較',
            transition: '✨ トランジション',
            reveal: '🎉 リビール',
            countdown: '⏱️ カウントダウン',
            recap: '📝 まとめ',
            conclusion: '🔔 結論・CTA',
        };
        return names[type] || type;
    };

    const buildTtsSegments = (sections: Section[]) => {
        const segments = sections.map((section, index) => {
            const label = `${index + 1}. ${getSectionTypeName(section.type)}`;
            let text = '';

            switch (section.type) {
                case 'title':
                    text = [section.mainTitle, section.subtitle].filter(Boolean).join(' ');
                    break;
                case 'hook':
                case 'keypoint':
                case 'conclusion':
                    text = section.onScreenText || '';
                    break;
                case 'quiz':
                    text = `クイズです。${section.question}。答えは${section.answer}。`;
                    break;
                case 'recap':
                    text = [section.onScreenText, ...(section.points || [])].filter(Boolean).join('、');
                    break;
                case 'story':
                    text = section.narration || '';
                    break;
                case 'dialogue':
                    text = section.dialogues.map(dialogue => dialogue.text).join(' ');
                    break;
                case 'fact':
                    text = `${section.number}${section.unit || ''}。${section.description}`;
                    break;
                case 'comparison':
                    text = `${section.leftLabel}は${section.leftContent}。${section.rightLabel}は${section.rightContent}。`;
                    break;
                case 'transition':
                    text = section.transitionText || '';
                    break;
                case 'reveal':
                    text = [section.buildup, section.revealText].filter(Boolean).join(' ');
                    break;
                case 'countdown':
                    text = section.label || '';
                    break;
                case 'character':
                    text = section.introText || '';
                    break;
                default:
                    text = '';
            }

            return {
                label,
                text: cleanInlineText(text),
                type: section.type,
            };
        });

        return segments.filter(segment => segment.text.trim().length > 0);
    };

    const buildOutlineFromSections = (sections: Section[]) => {
        const items = sections.map((section) => {
            switch (section.type) {
                case 'hook':
                case 'keypoint':
                case 'conclusion':
                case 'recap':
                    return cleanInlineText(section.onScreenText || '');
                case 'quiz':
                    return cleanInlineText(section.question || '');
                case 'story':
                    return cleanInlineText(section.narration || '');
                case 'fact':
                    return cleanInlineText(`${section.number}${section.unit || ''} ${section.description}`);
                case 'comparison':
                    return cleanInlineText(`${section.leftLabel} vs ${section.rightLabel}`);
                case 'title':
                    return cleanInlineText(section.mainTitle || '');
                case 'dialogue':
                    return cleanInlineText(section.dialogues.map(d => d.text).join(' '));
                case 'transition':
                    return cleanInlineText(section.transitionText || '');
                case 'reveal':
                    return cleanInlineText(section.revealText || '');
                case 'countdown':
                    return cleanInlineText(section.label || '');
                case 'character':
                    return cleanInlineText(section.introText || '');
                default:
                    return '';
            }
        }).filter(Boolean);

        return items.slice(0, 6);
    };

    const buildTemplatePreviewConfig = (template: TemplateDefinition): VideoConfig => {
        const baseTimeline = rebuildTimeline(template.defaultSections);
        const target = getTemplateTargetDuration(
            baseTimeline.sections.length,
            template.rules,
            baseTimeline.duration
        );
        const paced = template.rules
            ? autoPaceSections(baseTimeline.sections, target)
            : baseTimeline;

        return {
            title: `${template.name}動画`,
            themeLabel: template.themeLabel,
            themeId: template.themeId,
            duration: paced.duration,
            sections: paced.sections,
            characters: template.characters,
            bgmVolume: 0.12,
            audioPlan: {
                ...defaultAudioPlan,
                ttsPrompt: template.audioDefaults?.ttsPrompt || '',
                bgmPrompt: template.audioDefaults?.bgmPrompt || '',
                sfxNotes: template.audioDefaults?.sfxNotes || '',
            },
            disclaimer: '※ 内容は概算・参考情報です',
        };
    };

    const renderSectionEditor = (section: Section, index: number) => {
        const characters = config?.characters ?? [];

        switch (section.type) {
            case 'hook':
                return (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <span>フックタイプ</span>
                            <select
                                value={section.hookType || 'conclusion'}
                                onChange={(e) => updateSection(index, { hookType: e.target.value } as any)}
                                className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="number">数字</option>
                                <option value="pattern-break">常識破壊</option>
                                <option value="conclusion">結論先出し</option>
                                <option value="question">疑問投げ</option>
                            </select>
                            <button
                                onClick={() => handleGenerateHookSuggestions(section.hookType)}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 px-2 py-1 text-[11px] text-indigo-200 hover:border-indigo-400"
                            >
                                {hookLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'フック案を生成'}
                            </button>
                        </div>
                        <textarea
                            value={section.onScreenText || ''}
                            onChange={(e) => updateSection(index, { onScreenText: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="画面に表示するテキスト"
                        />
                        {hookError && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                {hookError}
                            </div>
                        )}
                        {hookSuggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {hookSuggestions.map((hook) => (
                                    <button
                                        key={hook}
                                        onClick={() => updateSection(index, { onScreenText: hook } as any)}
                                        className="rounded-full border border-gray-800 px-3 py-1 text-[11px] text-gray-200 hover:border-indigo-400 hover:text-white"
                                    >
                                        {hook}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'quiz':
                return (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={section.question}
                            onChange={(e) => updateSection(index, { question: e.target.value } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="クイズの質問"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {section.choices.map((choice, ci) => (
                                <input
                                    key={ci}
                                    type="text"
                                    value={choice}
                                    onChange={(e) => {
                                        const newChoices = [...section.choices];
                                        newChoices[ci] = e.target.value;
                                        updateSection(index, { choices: newChoices } as any);
                                    }}
                                    className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    placeholder={`選択肢${ci + 1}`}
                                />
                            ))}
                        </div>
                        <select
                            value={section.answer}
                            onChange={(e) => updateSection(index, { answer: e.target.value } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        >
                            {section.choices.map((choice, ci) => (
                                <option key={ci} value={choice}>{choice}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'title':
                return (
                    <div className="grid gap-2">
                        <input
                            type="text"
                            value={section.mainTitle}
                            onChange={(e) => updateSection(index, { mainTitle: e.target.value } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="メインタイトル"
                        />
                        <input
                            type="text"
                            value={section.subtitle ?? ''}
                            onChange={(e) => updateSection(index, { subtitle: e.target.value } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="サブタイトル（任意）"
                        />
                    </div>
                );
            case 'dialogue': {
                const dialogues = section.dialogues ?? [];
                const handleDialogueUpdate = (next: typeof dialogues) => {
                    updateSection(index, { dialogues: next } as any);
                };

                return (
                    <div className="space-y-3">
                        {dialogues.map((dialogue, lineIndex) => (
                            <div key={`${dialogue.characterId}-${lineIndex}`} className="flex flex-col sm:flex-row gap-2">
                                {characters.length > 0 ? (
                                    <select
                                        value={dialogue.characterId}
                                        onChange={(e) => {
                                            const next = [...dialogues];
                                            next[lineIndex] = { ...dialogue, characterId: e.target.value };
                                            handleDialogueUpdate(next);
                                        }}
                                        className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    >
                                        {characters.map((character) => (
                                            <option key={character.id} value={character.id}>
                                                {character.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={dialogue.characterId}
                                        onChange={(e) => {
                                            const next = [...dialogues];
                                            next[lineIndex] = { ...dialogue, characterId: e.target.value };
                                            handleDialogueUpdate(next);
                                        }}
                                        className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        placeholder="話者ID"
                                    />
                                )}
                                <input
                                    type="text"
                                    value={dialogue.text}
                                    onChange={(e) => {
                                        const next = [...dialogues];
                                        next[lineIndex] = { ...dialogue, text: e.target.value };
                                        handleDialogueUpdate(next);
                                    }}
                                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    placeholder="セリフ"
                                />
                                <button
                                    onClick={() => {
                                        if (dialogues.length <= 1) return;
                                        const next = dialogues.filter((_, i) => i !== lineIndex);
                                        handleDialogueUpdate(next);
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg border border-gray-800 px-2 py-2 text-xs text-gray-400 hover:border-gray-600 disabled:opacity-40"
                                    disabled={dialogues.length <= 1}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const fallbackId = characters[0]?.id || dialogues[0]?.characterId || 'speaker';
                                handleDialogueUpdate([
                                    ...dialogues,
                                    { characterId: fallbackId, text: '新しいセリフ' },
                                ]);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-200 hover:border-gray-600"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            セリフ追加
                        </button>
                    </div>
                );
            }
            case 'story':
                return (
                    <div className="grid gap-2">
                        <textarea
                            value={section.narration}
                            onChange={(e) => updateSection(index, { narration: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="ナレーション"
                        />
                        <textarea
                            value={section.visualDescription ?? ''}
                            onChange={(e) => updateSection(index, { visualDescription: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="映像描写（任意）"
                        />
                    </div>
                );
            case 'character':
                return (
                    <div className="grid gap-2">
                        <div className="text-xs text-gray-500">
                            キャラID: {section.characterId}
                        </div>
                        <textarea
                            value={section.introText}
                            onChange={(e) => updateSection(index, { introText: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="キャラクター紹介文"
                        />
                    </div>
                );
            case 'fact':
                return (
                    <div className="grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={section.number}
                                onChange={(e) => updateSection(index, { number: e.target.value } as any)}
                                className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                placeholder="数字"
                            />
                            <input
                                type="text"
                                value={section.unit ?? ''}
                                onChange={(e) => updateSection(index, { unit: e.target.value } as any)}
                                className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                placeholder="単位"
                            />
                        </div>
                        <textarea
                            value={section.description}
                            onChange={(e) => updateSection(index, { description: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="説明"
                        />
                    </div>
                );
            case 'comparison':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <input
                                type="text"
                                value={section.leftLabel}
                                onChange={(e) => updateSection(index, { leftLabel: e.target.value } as any)}
                                className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                placeholder="左ラベル"
                            />
                            <textarea
                                value={section.leftContent}
                                onChange={(e) => updateSection(index, { leftContent: e.target.value } as any)}
                                rows={2}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                                placeholder="左の内容"
                            />
                        </div>
                        <div className="grid gap-2">
                            <input
                                type="text"
                                value={section.rightLabel}
                                onChange={(e) => updateSection(index, { rightLabel: e.target.value } as any)}
                                className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                placeholder="右ラベル"
                            />
                            <textarea
                                value={section.rightContent}
                                onChange={(e) => updateSection(index, { rightContent: e.target.value } as any)}
                                rows={2}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                                placeholder="右の内容"
                            />
                        </div>
                    </div>
                );
            case 'transition':
                return (
                    <div className="grid gap-2">
                        <input
                            type="text"
                            value={section.transitionText ?? ''}
                            onChange={(e) => updateSection(index, { transitionText: e.target.value } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="トランジション文言（任意）"
                        />
                        <select
                            value={section.style}
                            onChange={(e) => updateSection(index, { style: e.target.value } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="fade">fade</option>
                            <option value="swipe">swipe</option>
                            <option value="zoom">zoom</option>
                            <option value="flash">flash</option>
                            <option value="dramatic">dramatic</option>
                        </select>
                    </div>
                );
            case 'reveal':
                return (
                    <div className="grid gap-2">
                        <textarea
                            value={section.buildup ?? ''}
                            onChange={(e) => updateSection(index, { buildup: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="盛り上げ文（任意）"
                        />
                        <textarea
                            value={section.revealText}
                            onChange={(e) => updateSection(index, { revealText: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="答え・発表"
                        />
                        <label className="flex items-center gap-2 text-xs text-gray-400">
                            <input
                                type="checkbox"
                                checked={section.celebrationEffect ?? false}
                                onChange={(e) => updateSection(index, { celebrationEffect: e.target.checked } as any)}
                                className="rounded border-gray-700 bg-gray-950"
                            />
                            祝い演出を入れる
                        </label>
                    </div>
                );
            case 'countdown':
                return (
                    <div className="grid gap-2">
                        <input
                            type="number"
                            value={section.startNumber}
                            onChange={(e) => updateSection(index, { startNumber: Number(e.target.value) } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="開始番号"
                        />
                        <input
                            type="text"
                            value={section.label ?? ''}
                            onChange={(e) => updateSection(index, { label: e.target.value } as any)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="ラベル（任意）"
                        />
                    </div>
                );
            case 'recap': {
                const points = section.points ?? [];
                const handlePointsUpdate = (next: string[]) => {
                    updateSection(index, { points: next } as any);
                };
                return (
                    <div className="space-y-3">
                        <textarea
                            value={section.onScreenText}
                            onChange={(e) => updateSection(index, { onScreenText: e.target.value } as any)}
                            rows={2}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="まとめタイトル"
                        />
                        <div className="space-y-2">
                            {points.map((point, pointIndex) => (
                                <div key={`${point}-${pointIndex}`} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={point}
                                        onChange={(e) => {
                                            const next = [...points];
                                            next[pointIndex] = e.target.value;
                                            handlePointsUpdate(next);
                                        }}
                                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        placeholder={`ポイント${pointIndex + 1}`}
                                    />
                                    <button
                                        onClick={() => {
                                            if (points.length <= 1) return;
                                            handlePointsUpdate(points.filter((_, i) => i !== pointIndex));
                                        }}
                                        className="inline-flex items-center justify-center rounded-lg border border-gray-800 px-2 py-2 text-xs text-gray-400 hover:border-gray-600 disabled:opacity-40"
                                        disabled={points.length <= 1}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => handlePointsUpdate([...points, '新しいポイント'])}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-200 hover:border-gray-600"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                ポイント追加
                            </button>
                        </div>
                    </div>
                );
            }
            case 'conclusion':
            case 'keypoint':
            default:
                return (
                    <textarea
                        value={section.onScreenText || ''}
                        onChange={(e) => updateSection(index, { onScreenText: e.target.value } as any)}
                        rows={2}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                        placeholder="画面に表示するテキスト"
                    />
                );
        }
    };

    const stepProgress = steps.length > 1
        ? Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))
        : 0;
    const activeRules = selectedTemplate?.rules ?? null;
    const isPacingLocked = Boolean(activeRules);
    const audioHints = selectedTemplate?.audioHints ?? {};
    const audioPlan = config?.audioPlan ?? defaultAudioPlan;
    const currentCutRate = config && config.duration > 0
        ? config.sections.length / (config.duration / 10)
        : 0;
    const previewTimeSec = previewFrame / 30;
    const hookLinePercent = config?.duration ? Math.min(100, (3 / config.duration) * 100) : 0;
    const renderStatus = renderJob?.status;
    const renderProgress = renderJob?.progress ?? 0;
    const renderMessage = renderJob?.message;
    const renderError = renderJob?.error;
    const renderAssetId = renderJob?.assetId;
    const isRenderActive = renderStatus === 'rendering' || renderStatus === 'queued';
    const hasRenderStatus = renderStatus === 'rendering'
        || renderStatus === 'queued'
        || renderStatus === 'completed'
        || renderStatus === 'failed';
    const ttsSegments = useMemo(() => {
        if (!config) return [];
        return buildTtsSegments(config.sections);
    }, [config?.sections]);
    const ttsSegmentText = useMemo(() => {
        return ttsSegments
            .map((segment, index) => `#${index + 1} ${segment.label}\n${segment.text}`)
            .join('\n\n');
    }, [ttsSegments]);
    const promptPack = useMemo(() => {
        if (!config) {
            return {
                ttsPrompt: '',
                sunoPrompt: '',
                runwayPrompt: '',
                soraPrompt: '',
                bundle: '',
            };
        }

        const tone = aiTone || aiPackage?.tone || 'テンポ良く分かりやすい解説';
        const title = config.title || aiTitle || aiTheme || 'ショート動画';
        const durationLabel = `${formatSec(config.duration)}秒`;
        const outline = aiPackage?.outline?.length
            ? aiPackage.outline
            : buildOutlineFromSections(config.sections);
        const assetIdeas = aiPackage?.assets?.length
            ? aiPackage.assets
            : [];
        const ttsBase = audioPlan.ttsText?.trim() || buildTtsTextFromSections(config.sections);
        const ttsBody = ttsSegmentText || ttsBase;

        const ttsPrompt = [
            '日本語のショート動画ナレーションとして読み上げてください。',
            audioPlan.ttsPrompt ? `演出: ${audioPlan.ttsPrompt}` : '',
            `トーン: ${tone}`,
            `長さ: ${durationLabel}`,
            '---',
            ttsBody,
        ].filter(Boolean).join('\n');

        const sunoPrompt = [
            'Instrumental BGM only (no vocals).',
            `Length: ${durationLabel}`,
            `Theme: ${title}`,
            `Tone: ${tone}`,
            `Prompt: ${audioPlan.bgmPrompt || `${title}に合う雰囲気のBGM`}`,
            outline.length ? `Outline: ${outline.join(' / ')}` : '',
        ].filter(Boolean).join('\n');

        const runwayPrompt = [
            'Vertical video (9:16), 1080x1920.',
            'Short B-roll clips, 4-6 seconds each, loop-friendly.',
            `Theme: ${title}`,
            `Tone: ${tone}`,
            outline.length ? `Key beats: ${outline.join(' / ')}` : '',
            assetIdeas.length ? `Shots: ${assetIdeas.join(' / ')}` : '',
            'Avoid text overlays. Focus on clean visuals and gentle camera motion.',
        ].filter(Boolean).join('\n');

        const soraPrompt = [
            'Cinematic vertical shots for YouTube Shorts (9:16).',
            `Theme: ${title}`,
            `Tone: ${tone}`,
            outline.length ? `Story beats: ${outline.join(' / ')}` : '',
            assetIdeas.length ? `Visual ideas: ${assetIdeas.join(' / ')}` : '',
            'Keep shots short, high contrast, and clear subject framing.',
        ].filter(Boolean).join('\n');

        const sfxPrompt = audioPlan.sfxNotes ? `SFX: ${audioPlan.sfxNotes}` : '';
        const bundle = [
            '# Google AI Studio TTS',
            ttsPrompt,
            '',
            '# Suno BGM Prompt',
            sunoPrompt,
            '',
            '# SFX Notes',
            sfxPrompt || 'SFX: (未設定)',
            '',
            '# Runway Prompt',
            runwayPrompt,
            '',
            '# Sora2 Prompt',
            soraPrompt,
        ].join('\n');

        return { ttsPrompt, sunoPrompt, runwayPrompt, soraPrompt, bundle };
    }, [config, aiTone, aiPackage, aiTitle, aiTheme, audioPlan, ttsSegmentText]);

    const assetSuggestions = (() => {
        if (!assetPickerTarget) return [];
        if (assetPickerTarget.kind === 'bgm') return audioHints.bgmKeywords ?? [];
        if (assetPickerTarget.kind === 'sfx') return audioHints.sfxKeywords ?? [];
        if (assetPickerTarget.kind === 'narration') return audioHints.narrationKeywords ?? [];
        return [];
    })();

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
                                            {currentStep > step.id ? <Check className="h-3 w-3" /> : step.id}
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
                    <div className="mt-3 h-1 w-full rounded-full bg-gray-800">
                        <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${stepProgress}%` }}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {showDraftPrompt && pendingDraft && (
                    <div className="mb-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="font-medium">AI作成の下書きがあります</p>
                            <p className="text-xs text-indigo-200/80">
                                「{pendingDraft.title}」を読み込みますか？
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleLoadDraft}
                                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
                            >
                                読み込む
                            </button>
                            <button
                                onClick={handleDismissDraft}
                                className="rounded-lg border border-indigo-400/40 px-3 py-1.5 text-xs text-indigo-100 hover:border-indigo-300"
                            >
                                破棄
                            </button>
                        </div>
                    </div>
                )}
                {/* ステップ1: テンプレート選択 */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-semibold mb-2">どんな動画を作りますか？</h2>
                            <p className="text-gray-400">テンプレートを選んでスタート</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {templates.map((template) => {
                                const previewConfig = buildTemplatePreviewConfig(template);
                                const previewDurationFrames = Math.max(1, Math.round(previewConfig.duration * 30));
                                const previewFrame = Math.min(30, previewDurationFrames - 1);
                                return (
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
                                            <div className="mb-4 overflow-hidden rounded-xl border border-gray-800 bg-gray-950/60">
                                                <div className="relative h-28">
                                                    <Thumbnail
                                                        component={MedicalShorts as any}
                                                        inputProps={previewConfig as any}
                                                        durationInFrames={previewDurationFrames}
                                                        fps={30}
                                                        frameToDisplay={previewFrame}
                                                        compositionWidth={1080}
                                                        compositionHeight={1920}
                                                        style={{ width: '100%', height: '100%' }}
                                                        renderLoading={() => (
                                                            <div className="flex h-full w-full items-center justify-center bg-gray-900 text-[11px] text-gray-400">
                                                                プレビュー準備中
                                                            </div>
                                                        )}
                                                        errorFallback={() => (
                                                            <div className="flex h-full w-full items-center justify-center bg-gray-900 text-[11px] text-gray-400">
                                                                プレビュー不可
                                                            </div>
                                                        )}
                                                    />
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${template.preview?.gradient ?? "from-gray-800 to-gray-900"} opacity-40`} />
                                                    <div className="absolute left-3 top-3">
                                                        <p className="text-xs font-semibold text-white/90">
                                                            {template.preview?.title || template.name}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-white/60">
                                                            {template.preview?.subtitle || template.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                                            <p className="text-sm text-gray-400">{template.description}</p>
                                            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                                <span className="px-2 py-1 bg-gray-800 rounded">{template.defaultSections.length}シーン</span>
                                                <span className="px-2 py-1 bg-gray-800 rounded">{template.themeId}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-sm text-gray-500">
                                💡 ヒント: テンプレルールに合わせてテンポと文字密度を自動調整します
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
                                        disabled={isPacingLocked}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="h-4 w-4" />
                                        ポイント追加
                                    </button>
                                    <button
                                        onClick={() => addSection('quiz')}
                                        disabled={isPacingLocked}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="h-4 w-4" />
                                        クイズ追加
                                    </button>
                                </div>
                            </div>

                            {/* AI Assist */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                                        <Sparkles className="h-4 w-4 text-indigo-300" />
                                        AIアシスト
                                    </div>
                                    <button
                                        onClick={handleAIGenerate}
                                        disabled={aiLoading}
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '生成して反映'}
                                    </button>
                                </div>
                                <div className="grid gap-2">
                                    <input
                                        value={aiTheme}
                                        onChange={(e) => setAiTheme(e.target.value)}
                                        placeholder="テーマ（例: 眼の健康）"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    <input
                                        value={aiTone}
                                        onChange={(e) => setAiTone(e.target.value)}
                                        placeholder="仮トーン（後で修正可）"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    <input
                                        value={aiTitle}
                                        onChange={(e) => setAiTitle(e.target.value)}
                                        placeholder="タイトル（任意）"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                {aiOutline.length > 0 && (
                                    <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300 space-y-1">
                                        {aiOutline.map((item, index) => (
                                            <div key={`${item}-${index}`}>・{item}</div>
                                        ))}
                                    </div>
                                )}
                                {aiTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {aiTags.map((tag) => (
                                            <span key={tag} className="rounded-full bg-gray-800 px-2 py-1 text-[10px] text-gray-300">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleAIApply}
                                        disabled={!aiPackage}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500 disabled:opacity-50"
                                    >
                                        再反映
                                    </button>
                                    <button
                                        onClick={handleCopyTags}
                                        disabled={aiTags.length === 0}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500 disabled:opacity-50"
                                    >
                                        <Copy className="h-3 w-3" />
                                        タグをコピー
                                    </button>
                                </div>
                            </div>

                            {/* Quality Boost */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                                        <Lightbulb className="h-4 w-4 text-amber-300" />
                                        クオリティ強化
                                    </div>
                                    <button
                                        onClick={handlePolishText}
                                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-amber-400"
                                    >
                                        文字組みを整える
                                    </button>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs text-gray-400">テンポ（目標尺）</label>
                                    <div className="flex flex-wrap gap-2">
                                        <select
                                            value={targetDuration}
                                            onChange={(e) => setTargetDuration(Number(e.target.value))}
                                            disabled={isPacingLocked}
                                            className="min-w-[120px] bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <option value={15}>15秒（超短尺）</option>
                                            <option value={20}>20秒（ミニ）</option>
                                            <option value={25}>25秒（短尺+）</option>
                                            <option value={30}>30秒（短尺）</option>
                                            <option value={45}>45秒（標準）</option>
                                            <option value={50}>50秒（標準+）</option>
                                            <option value={60}>60秒（最大）</option>
                                            <option value={75}>75秒（長尺）</option>
                                            <option value={90}>90秒（特別）</option>
                                        </select>
                                        <button
                                            onClick={handleAutoPace}
                                            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-medium text-amber-100 hover:border-amber-300"
                                        >
                                            <Timer className="h-3.5 w-3.5" />
                                            テンポを合わせる
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        合計 {formatSec(config.duration)}秒 / 目標 {targetDuration}秒
                                    </p>
                                    {activeRules && (
                                        <p className="text-[11px] text-amber-200">
                                            テンプレ規定: {activeRules.targetDurationSec}秒 / {activeRules.cutsPer10s.toFixed(1)} cuts/10s（現在 {currentCutRate.toFixed(1)}）
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs text-gray-400">1行あたりの目安</label>
                                    <select
                                        value={lineLength}
                                        onChange={(e) => setLineLength(Number(e.target.value))}
                                        disabled={isPacingLocked}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value={12}>12文字（テンポ重視）</option>
                                        <option value={14}>14文字（標準）</option>
                                        <option value={16}>16文字（情報量重視）</option>
                                    </select>
                                    {activeRules && (
                                        <p className="text-[11px] text-amber-200">
                                            ルール: {activeRules.lineLength}文字 × 最大{activeRules.maxLines}行
                                        </p>
                                    )}
                                </div>
                                <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-400 space-y-1">
                                    {qualityWarnings.length > 0 ? (
                                        qualityWarnings.map((warning) => (
                                            <div key={warning}>⚠️ {warning}</div>
                                        ))
                                    ) : (
                                        <div>✅ 品質チェック: OK</div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    テキストを短い行に整えて、視認性とテンポを上げます。
                                </p>
                            </div>

                            {/* Audio & SFX */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                                        <Music className="h-4 w-4 text-cyan-300" />
                                        音声・BGM・効果音
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs text-gray-400">TTS（音声ナレーション）</label>
                                    <div className="flex flex-wrap gap-2">
                                        <select
                                            value={audioPlan.ttsProvider || 'google-ai-studio'}
                                            onChange={(e) => updateAudioPlan({ ttsProvider: e.target.value as AudioPlan['ttsProvider'] })}
                                            className="min-w-[160px] bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                        >
                                            <option value="google-ai-studio">Google AI Studio</option>
                                            <option value="elevenlabs">ElevenLabs</option>
                                            <option value="none">なし</option>
                                        </select>
                                        <button
                                            onClick={handleBuildTtsText}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-200 hover:border-gray-500"
                                        >
                                            <Mic className="h-3.5 w-3.5" />
                                            セクションから生成
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!aiPackage?.script) return;
                                                updateAudioPlan({ ttsText: aiPackage.script });
                                            }}
                                            disabled={!aiPackage?.script}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-200 hover:border-gray-500 disabled:opacity-50"
                                        >
                                            AI台本を反映
                                        </button>
                                    </div>
                                    <input
                                        value={audioPlan.ttsPrompt || ''}
                                        onChange={(e) => updateAudioPlan({ ttsPrompt: e.target.value })}
                                        placeholder="TTSの演出指示（例: 明るくテンポ良く）"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                    />
                                    <textarea
                                        value={audioPlan.ttsText || ''}
                                        onChange={(e) => updateAudioPlan({ ttsText: e.target.value })}
                                        rows={3}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                        placeholder="読み上げ用テキストを入力"
                                    />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            value={config.narration || ''}
                                            onChange={(e) => updateAudioPlan({ narrationPath: e.target.value }, { narration: e.target.value })}
                                            placeholder="ナレーション音声のパス（例: audio/tts/voice.mp3）"
                                            className="flex-1 min-w-[220px] bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => openAssetPicker({ kind: 'narration' })}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-200 hover:border-gray-500"
                                        >
                                            素材から選ぶ
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        選択中: {config.narration ? getPathLabel(config.narration) : '未設定'}
                                    </p>
                                    <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-400 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span>セクションごとのTTS原稿</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => copyText(ttsSegmentText, '分割原稿をコピーしました')}
                                                    className="text-xs text-gray-300 hover:text-gray-100"
                                                >
                                                    まとめてコピー
                                                </button>
                                                <button
                                                    onClick={() => downloadTextFile('tts_segments.txt', ttsSegmentText)}
                                                    className="text-xs text-gray-300 hover:text-gray-100"
                                                >
                                                    ダウンロード
                                                </button>
                                            </div>
                                        </div>
                                        {ttsSegments.length > 0 ? (
                                            <div className="max-h-40 space-y-2 overflow-y-auto">
                                                {ttsSegments.map((segment, index) => (
                                                    <div key={`${segment.label}-${index}`} className="rounded-md border border-gray-800 bg-black/40 px-2 py-2">
                                                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                            <span>{segment.label}</span>
                                                            <button
                                                                onClick={() => copyText(segment.text, '原稿をコピーしました')}
                                                                className="text-[11px] text-gray-300 hover:text-gray-100"
                                                            >
                                                                コピー
                                                            </button>
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-300">{segment.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">原稿がまだありません</div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs text-gray-400">BGM</label>
                                    <div className="flex flex-wrap gap-2">
                                        <select
                                            value={audioPlan.bgmProvider || 'suno'}
                                            onChange={(e) => updateAudioPlan({ bgmProvider: e.target.value as AudioPlan['bgmProvider'] })}
                                            className="min-w-[150px] bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                        >
                                            <option value="suno">Suno</option>
                                            <option value="runway">Runway</option>
                                            <option value="sora2">Sora2</option>
                                            <option value="local">ローカル</option>
                                            <option value="none">なし</option>
                                        </select>
                                        <input
                                            type="range"
                                            min={0}
                                            max={0.3}
                                            step={0.01}
                                            value={config.bgmVolume ?? 0.12}
                                            onChange={(e) => updateAudioPlan({}, { bgmVolume: Number(e.target.value) })}
                                            className="flex-1 min-w-[140px]"
                                        />
                                        <span className="text-xs text-gray-500">
                                            音量 {Math.round((config.bgmVolume ?? 0.12) * 100)}
                                        </span>
                                    </div>
                                    <input
                                        value={audioPlan.bgmPrompt || ''}
                                        onChange={(e) => updateAudioPlan({ bgmPrompt: e.target.value })}
                                        placeholder="BGMの指示（例: 透明感のあるLo-fi）"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                    />
                                    {audioHints.bgmKeywords?.length ? (
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                            <span>おすすめキーワード:</span>
                                            {audioHints.bgmKeywords.map((keyword) => (
                                                <button
                                                    key={keyword}
                                                    onClick={() => openAssetPicker({ kind: 'bgm', search: keyword })}
                                                    className="rounded-full border border-gray-800 px-2 py-1 text-[11px] text-gray-300 hover:border-indigo-500/60 hover:text-white"
                                                >
                                                    {keyword}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            value={config.bgm || ''}
                                            onChange={(e) => updateAudioPlan({ bgmAssetId: '' }, { bgm: e.target.value })}
                                            placeholder="BGMファイルのパス（例: audio/bgm/track.mp3）"
                                            className="flex-1 min-w-[220px] bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => openAssetPicker({ kind: 'bgm' })}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-200 hover:border-gray-500"
                                        >
                                            素材から選ぶ
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        選択中: {config.bgm ? getPathLabel(config.bgm) : '未設定'}
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs text-gray-400">効果音（SFX）</label>
                                    <textarea
                                        value={audioPlan.sfxNotes || ''}
                                        onChange={(e) => updateAudioPlan({ sfxNotes: e.target.value })}
                                        rows={2}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                                        placeholder="例: フックはpop、クイズの正解でchime"
                                    />
                                </div>

                                <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-400 space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span>生成用プロンプト</span>
                                        <button
                                            onClick={() => downloadTextFile('shorts_audio_prompts.txt', promptPack.bundle)}
                                            className="text-xs text-gray-300 hover:text-gray-100"
                                        >
                                            まとめてダウンロード
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="rounded-md border border-gray-800 bg-black/40 px-2 py-2">
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Google AI Studio TTS</span>
                                                <button
                                                    onClick={() => copyText(promptPack.ttsPrompt, 'TTSプロンプトをコピーしました')}
                                                    className="text-[11px] text-gray-300 hover:text-gray-100"
                                                >
                                                    コピー
                                                </button>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-300">{promptPack.ttsPrompt}</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-black/40 px-2 py-2">
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Suno BGM</span>
                                                <button
                                                    onClick={() => copyText(promptPack.sunoPrompt, 'Sunoプロンプトをコピーしました')}
                                                    className="text-[11px] text-gray-300 hover:text-gray-100"
                                                >
                                                    コピー
                                                </button>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-300">{promptPack.sunoPrompt}</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-black/40 px-2 py-2">
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>SFXメモ</span>
                                                <button
                                                    onClick={() => copyText(audioPlan.sfxNotes || '', 'SFXメモをコピーしました')}
                                                    className="text-[11px] text-gray-300 hover:text-gray-100"
                                                >
                                                    コピー
                                                </button>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-300">
                                                {audioPlan.sfxNotes || '未設定'}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-black/40 px-2 py-2">
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Runway</span>
                                                <button
                                                    onClick={() => copyText(promptPack.runwayPrompt, 'Runwayプロンプトをコピーしました')}
                                                    className="text-[11px] text-gray-300 hover:text-gray-100"
                                                >
                                                    コピー
                                                </button>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-300">{promptPack.runwayPrompt}</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-black/40 px-2 py-2">
                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Sora2</span>
                                                <button
                                                    onClick={() => copyText(promptPack.soraPrompt, 'Sora2プロンプトをコピーしました')}
                                                    className="text-[11px] text-gray-300 hover:text-gray-100"
                                                >
                                                    コピー
                                                </button>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-300">{promptPack.soraPrompt}</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[11px] text-gray-500">
                                    生成素材は素材ライブラリにアップロード後、「素材から選ぶ」で即反映できます。
                                </p>
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
                                {config.sections.map((section, index) => {
                                    const duration = getSectionDuration(section);
                                    const minDuration = getMinDuration(section);
                                    const durationWarning = duration < minDuration;
                                    const isHookWindow = section.startSec < 3;
                                    const canMoveUp = index > 0
                                        && section.type !== 'hook'
                                        && section.type !== 'conclusion'
                                        && config.sections[index - 1].type !== 'hook';
                                    const canMoveDown = index < config.sections.length - 1
                                        && section.type !== 'hook'
                                        && section.type !== 'conclusion'
                                        && config.sections[index + 1].type !== 'conclusion';

                                    return (
                                        <div
                                            key={index}
                                            className={`bg-gray-900 border rounded-xl p-4 group ${isHookWindow
                                                ? 'border-amber-400/60 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]'
                                                : 'border-gray-800'
                                                }`}
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <GripVertical className="h-4 w-4 text-gray-600" />
                                                    <span className="text-sm font-medium">{getSectionTypeName(section.type)}</span>
                                                    {isHookWindow && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[10px] text-amber-200">
                                                            <Star className="h-3 w-3" />
                                                            ここがバズの鍵
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {formatSec(section.startSec)}秒 〜 {formatSec(section.endSec)}秒
                                                    </span>
                                                    <div
                                                        className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${durationWarning
                                                            ? 'border-amber-500/60 text-amber-200'
                                                            : 'border-gray-800 text-gray-400'
                                                            }`}
                                                    >
                                                        <Timer className="h-3.5 w-3.5" />
                                                        <input
                                                            type="number"
                                                            value={duration}
                                                            min={minDuration}
                                                            step={0.5}
                                                            disabled={isPacingLocked}
                                                            onChange={(e) => {
                                                                const value = Number(e.target.value);
                                                                if (!Number.isFinite(value)) return;
                                                                setSectionDuration(index, value);
                                                            }}
                                                            className="w-14 bg-transparent text-right focus:outline-none disabled:text-gray-600"
                                                        />
                                                        <span className="text-[10px] text-gray-500">秒</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => moveSection(index, -1)}
                                                        disabled={!canMoveUp}
                                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronUp className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveSection(index, 1)}
                                                        disabled={!canMoveDown}
                                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </button>
                                                    {section.type !== 'hook' && section.type !== 'conclusion' && (
                                                        <button
                                                            onClick={() => removeSection(index)}
                                                            disabled={isPacingLocked}
                                                            className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {renderSectionEditor(section, index)}

                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                <span>効果音</span>
                                                <input
                                                    value={section.soundEffect || ''}
                                                    onChange={(e) => updateSection(index, { soundEffect: e.target.value } as any)}
                                                    placeholder="audio/se/pop.mp3"
                                                    className="flex-1 min-w-[200px] bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => openAssetPicker({ kind: 'sfx', index })}
                                                    className="text-xs text-gray-300 hover:text-gray-100"
                                                >
                                                    素材から選ぶ
                                                </button>
                                                <button
                                                    onClick={() => updateSection(index, { soundEffect: '' } as any)}
                                                    className="text-xs text-gray-400 hover:text-gray-200"
                                                >
                                                    クリア
                                                </button>
                                            </div>
                                            {audioHints.sfxKeywords?.length ? (
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                                    <span>おすすめ:</span>
                                                    {audioHints.sfxKeywords.map((keyword) => (
                                                        <button
                                                            key={`${keyword}-${index}`}
                                                            onClick={() => openAssetPicker({ kind: 'sfx', index, search: keyword })}
                                                            className="rounded-full border border-gray-800 px-2 py-1 text-[11px] text-gray-300 hover:border-indigo-500/60 hover:text-white"
                                                        >
                                                            {keyword}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
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
                                            style={{ width: 240, height: 426 }}
                                            controls
                                            loop
                                            renderLoading={() => (
                                                <div className="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-gray-400">
                                                    プレビューを準備中...
                                                </div>
                                            )}
                                            errorFallback={({ error }) => (
                                                <div className="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-red-300 px-3 text-center">
                                                    プレビューを読み込めません: {error.message}
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    合計 {formatSec(config.duration)}秒 • {config.sections.length}シーン
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
                            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
                                <Player
                                    ref={previewPlayerRef}
                                    component={MedicalShorts as any}
                                    inputProps={config as any}
                                    durationInFrames={Math.round(config.duration * 30)}
                                    fps={30}
                                    compositionWidth={1080}
                                    compositionHeight={1920}
                                    style={{ width: 320, height: 568 }}
                                    controls
                                    loop
                                    autoPlay
                                    renderLoading={() => (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-gray-400">
                                            プレビューを準備中...
                                        </div>
                                    )}
                                    errorFallback={({ error }) => (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-red-300 px-3 text-center">
                                            プレビューを読み込めません: {error.message}
                                        </div>
                                    )}
                                />
                                <div className="pointer-events-none absolute inset-0">
                                    <div className="absolute left-3 top-3 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] text-amber-200">
                                        最初の3秒が勝負
                                    </div>
                                    {previewTimeSec >= 3 && (
                                        <div className="absolute right-3 top-3 rounded-full bg-red-500/20 px-3 py-1 text-[11px] text-red-200">
                                            ここで視聴者50%離脱ライン
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <div className="h-1 w-full rounded-full bg-white/10" />
                                        <div
                                            className="absolute top-0 h-1 w-0.5 rounded-full bg-amber-300"
                                            style={{ left: `${hookLinePercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 情報＆アクション */}
                            <div className="space-y-4 w-full lg:w-80">
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                                    <h3 className="font-medium">{config.title}</h3>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 bg-gray-800 rounded">{formatSec(config.duration)}秒</span>
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
                                    下書きを保存
                                </button>

                                <button
                                    onClick={handleRenderVideo}
                                    disabled={isRenderActive}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-medium text-black transition-colors disabled:opacity-50"
                                >
                                    {isRenderActive ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        '動画を作成'
                                    )}
                                </button>

                                {hasRenderStatus && (
                                    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 text-xs text-gray-300 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span>動画作成状況</span>
                                            <span>{renderProgress}%</span>
                                        </div>
                                        {renderMessage && (
                                            <div className="text-[11px] text-gray-500">{renderMessage}</div>
                                        )}
                                        <div className="h-2 w-full rounded-full bg-gray-800">
                                            <div
                                                className="h-full rounded-full bg-emerald-400 transition-all"
                                                style={{ width: `${renderProgress}%` }}
                                            />
                                        </div>
                                        {renderStatus === 'completed' && (
                                            <div className="text-emerald-200">
                                                動画が保存されました。
                                                <Link href="/assets" className="ml-2 underline">
                                                    素材ライブラリを見る →
                                                </Link>
                                                {renderAssetId && (
                                                    <div className="mt-1 text-[10px] text-emerald-100/80">
                                                        Asset ID: {renderAssetId}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {renderStatus === 'failed' && (
                                            <div className="text-red-300">
                                                {renderError || '動画作成に失敗しました'}
                                            </div>
                                        )}
                                    </div>
                                )}

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

            <AssetPickerModal
                isOpen={!!assetPickerTarget}
                onClose={() => setAssetPickerTarget(null)}
                onSelect={handleAssetPicked}
                title="音声・BGM・効果音を選択"
                filterType="audio"
                initialSearch={assetPickerTarget?.search || ''}
                suggestedTerms={assetSuggestions}
            />
        </div>
    );
}
