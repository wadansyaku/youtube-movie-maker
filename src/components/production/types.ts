// Episode Detail Types
export interface EpisodeTask {
    id: string;
    title: string;
    status: string;
    priority: number;
    tags: string[];
}

export interface EpisodeSource {
    id: string;
    type: string;
    title: string | null;
    url: string | null;
    notes: string | null;
    tags: string[];
}

export interface GenerationPrompt {
    id: string;
    platform: string;
    promptText: string;
    resultUrl: string | null;
}

export interface EpisodeTemplate {
    id: string;
    type: string;
    name: string;
    content: Record<string, unknown>;
    variables: string[];
}

export interface ProductionEpisode {
    id: string;
    title: string;
    variant: string;
    lane: string | null;
    status: string;
    targetAudience: string | null;
    targetDuration: number | null;
    purposeStatement: string | null;
    hookScript: string | null;
    ctaScript: string | null;
    pinnedComment: string | null;
    ttsText: string | null;
    ttsDictionary: Array<{ term: string; reading: string }>;
    slideOutline: string | null;
    scriptContent: Record<string, unknown>;
    youtubeTitle: string | null;
    youtubeDescription: string | null;
    youtubeTags: string[];
    thumbnailBrief: string | null;
    originalityChecks: Record<string, boolean>;
    tasks: EpisodeTask[];
    sources: EpisodeSource[];
    generationPrompts: GenerationPrompt[];
    parentEpisode?: { id: string; title: string; variant: string } | null;
    childVariants?: Array<{ id: string; title: string; variant: string; status: string }>;
}

export const STATUS_OPTIONS = [
    { key: 'scripting', label: '台本作成', color: 'bg-blue-500' },
    { key: 'voice', label: '音声収録', color: 'bg-purple-500' },
    { key: 'assets', label: '素材準備', color: 'bg-yellow-500' },
    { key: 'editing', label: '編集中', color: 'bg-orange-500' },
    { key: 'review', label: 'レビュー', color: 'bg-pink-500' },
    { key: 'scheduled', label: '公開予定', color: 'bg-cyan-500' },
    { key: 'published', label: '公開済', color: 'bg-green-500' },
];

export const ORIGINALITY_CHECKS = [
    { key: 'selfMadeDiagram', label: '自作図解を含む' },
    { key: 'ownJudgment', label: '独自の判断・解釈がある' },
    { key: 'paraphrasedContent', label: '言い換え・要約している' },
    { key: 'referencesCleared', label: '参考明示済み' },
];

export type TabType = 'overview' | 'script' | 'assets' | 'metadata';
