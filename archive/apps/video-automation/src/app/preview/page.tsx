'use client';

import { useState } from 'react';
import { Play, Film, Settings } from 'lucide-react';
import { RemotionPreview } from '@/components/player/RemotionPreview';

type CompositionId = 'MedicalShorts' | 'HelloWorld';

interface CompositionInfo {
    id: CompositionId;
    name: string;
    description: string;
    aspectRatio: string;
    duration: string;
}

const compositions: CompositionInfo[] = [
    {
        id: 'MedicalShorts',
        name: 'Medical Shorts',
        description: 'YouTube Shorts向け医学解説動画（9:16縦型）',
        aspectRatio: '9:16',
        duration: '60秒',
    },
    {
        id: 'HelloWorld',
        name: 'Hello World',
        description: 'サンプルコンポジション（16:9横型）',
        aspectRatio: '16:9',
        duration: '5秒',
    },
];

export default function PreviewPage() {
    const [selectedComposition, setSelectedComposition] = useState<CompositionId>('MedicalShorts');

    const currentComposition = compositions.find(c => c.id === selectedComposition);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">プレビュー</h1>
                <p className="text-[var(--muted)]">
                    Remotionコンポジションをリアルタイムでプレビュー
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composition Selector */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Film className="w-5 h-5" />
                        コンポジション選択
                    </h2>
                    <div className="space-y-2">
                        {compositions.map((comp) => (
                            <button
                                key={comp.id}
                                onClick={() => setSelectedComposition(comp.id)}
                                className={`w-full text-left p-4 rounded-lg border transition ${selectedComposition === comp.id
                                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                        : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)]'
                                    }`}
                            >
                                <div className="font-medium">{comp.name}</div>
                                <div className="text-sm text-[var(--muted)] mt-1">
                                    {comp.aspectRatio} • {comp.duration}
                                </div>
                            </button>
                        ))}
                    </div>

                    {currentComposition && (
                        <div className="card p-4 mt-4">
                            <h3 className="font-medium mb-2">{currentComposition.name}</h3>
                            <p className="text-sm text-[var(--muted)]">
                                {currentComposition.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Preview Player */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Play className="w-5 h-5" />
                            プレビュー
                        </h2>
                    </div>

                    <div className={selectedComposition === 'MedicalShorts' ? 'max-w-sm mx-auto' : ''}>
                        <RemotionPreview
                            compositionId={selectedComposition}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
