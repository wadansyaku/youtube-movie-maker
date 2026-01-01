'use client';

import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Step {
    key: string;
    label: string;
    icon: string;
    color: string;
}

const PRODUCTION_STEPS: Step[] = [
    { key: 'scripting', label: '台本作成', icon: '📝', color: 'bg-blue-500' },
    { key: 'voice', label: '音声収録', icon: '🎙️', color: 'bg-purple-500' },
    { key: 'assets', label: '素材準備', icon: '🎨', color: 'bg-yellow-500' },
    { key: 'editing', label: '編集', icon: '✂️', color: 'bg-orange-500' },
    { key: 'review', label: 'レビュー', icon: '👀', color: 'bg-pink-500' },
    { key: 'scheduled', label: '公開予定', icon: '📅', color: 'bg-cyan-500' },
    { key: 'published', label: '公開済', icon: '🎉', color: 'bg-green-500' },
];

interface Props {
    currentStatus: string;
    onStatusChange?: (newStatus: string) => void;
    compact?: boolean;
}

export function EpisodeStepGuide({ currentStatus, onStatusChange, compact = false }: Props) {
    const currentIndex = PRODUCTION_STEPS.findIndex(s => s.key === currentStatus);

    const getStepState = (index: number): 'completed' | 'current' | 'upcoming' => {
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'upcoming';
    };

    if (compact) {
        // Compact horizontal progress bar
        return (
            <div className="flex items-center gap-1 w-full">
                {PRODUCTION_STEPS.map((step, index) => {
                    const state = getStepState(index);
                    return (
                        <div key={step.key} className="flex items-center flex-1">
                            <div
                                className={`h-1.5 flex-1 rounded-full transition-all ${state === 'completed'
                                        ? 'bg-green-500'
                                        : state === 'current'
                                            ? step.color
                                            : 'bg-gray-700'
                                    }`}
                                title={step.label}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    // Full step guide
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <span className="font-medium">制作フロー</span>
                <span className="ml-auto">
                    {currentIndex + 1}/{PRODUCTION_STEPS.length} ステップ
                </span>
            </div>

            <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
                {PRODUCTION_STEPS.map((step, index) => {
                    const state = getStepState(index);
                    const isClickable = onStatusChange && Math.abs(index - currentIndex) <= 1;

                    return (
                        <div key={step.key} className="flex items-center">
                            <button
                                onClick={() => isClickable && onStatusChange?.(step.key)}
                                disabled={!isClickable}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${state === 'completed'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                        : state === 'current'
                                            ? `${step.color.replace('bg-', 'bg-')}/20 text-white border border-white/20`
                                            : 'bg-gray-800/50 text-gray-500 border border-gray-700/50'
                                    } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                            >
                                {state === 'completed' ? (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                    <span>{step.icon}</span>
                                )}
                                <span className="whitespace-nowrap hidden sm:inline">{step.label}</span>
                            </button>
                            {index < PRODUCTION_STEPS.length - 1 && (
                                <ArrowRight className={`w-3 h-3 mx-0.5 flex-shrink-0 ${state === 'completed' ? 'text-green-500' : 'text-gray-600'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Current step description */}
            {currentIndex >= 0 && (
                <div className="mt-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${PRODUCTION_STEPS[currentIndex].color}`} />
                        <span className="text-sm font-medium text-white">
                            {PRODUCTION_STEPS[currentIndex].icon} {PRODUCTION_STEPS[currentIndex].label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">
                        {getStepDescription(currentStatus)}
                    </p>
                </div>
            )}
        </div>
    );
}

function getStepDescription(status: string): string {
    const descriptions: Record<string, string> = {
        scripting: '台本を作成し、構成を確定させましょう。AIを活用して効率的に進められます。',
        voice: '台本に基づいて音声を収録します。TTS設定や辞書の調整も行えます。',
        assets: '動画に使用する素材（画像、BGM、効果音など）を準備します。',
        editing: '素材を組み合わせて動画を編集します。タイムラインで確認しましょう。',
        review: '完成した動画をレビューし、最終確認を行います。',
        scheduled: '公開日時を設定し、公開準備を整えます。',
        published: 'おめでとうございます！動画が公開されました。パフォーマンスを確認しましょう。',
    };
    return descriptions[status] || '次のステップに進みましょう。';
}

export default EpisodeStepGuide;
