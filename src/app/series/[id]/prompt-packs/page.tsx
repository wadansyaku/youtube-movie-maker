import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createPromptPack } from '@/app/actions';
import PromptPackEditor from '@/components/prompt/PromptPackEditor';

interface Props {
    params: Promise<{ id: string }>;
}

async function getSeriesWithPromptPacks(id: string) {
    return prisma.series.findUnique({
        where: { id },
        include: {
            promptPacks: {
                orderBy: { createdAt: 'desc' },
                include: {
                    prompts: true,
                },
            },
        },
    });
}

export default async function PromptPacksPage({ params }: Props) {
    const { id } = await params;
    const series = await getSeriesWithPromptPacks(id);

    if (!series) {
        notFound();
    }

    const createAction = createPromptPack.bind(null, id);

    return (
        <div className="p-8 animate-fade-in">
            {/* Breadcrumb */}
            <div className="text-sm text-[var(--muted)] mb-4">
                <Link href="/series" className="hover:text-white">シリーズ</Link>
                <span className="mx-2">/</span>
                <Link href={`/series/${id}`} className="hover:text-white">{series.title}</Link>
                <span className="mx-2">/</span>
                <span>PromptPack</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>📝</span> PromptPack マネージャ
                    </h1>
                    <p className="text-[var(--muted)] text-sm mt-1">
                        Runway/Sunoで使用するプロンプトを一元管理
                    </p>
                </div>
            </div>

            {/* New PromptPack Form */}
            <form
                action={async (formData) => {
                    'use server';
                    await createAction(formData);
                }}
                className="card p-4 mb-6"
            >
                <div className="flex gap-3">
                    <input
                        type="text"
                        name="name"
                        placeholder="新しいPromptPackの名前"
                        required
                        className="input flex-1"
                    />
                    <select name="category" className="input w-auto">
                        <option value="general">一般</option>
                        <option value="visual">ビジュアル (Runway)</option>
                        <option value="audio">オーディオ (Suno)</option>
                        <option value="narrative">ナラティブ</option>
                    </select>
                    <button type="submit" className="btn btn-primary">
                        ＋ 作成
                    </button>
                </div>
            </form>

            {/* PromptPack List */}
            {series.promptPacks.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-5xl mb-4">📝</div>
                    <h2 className="text-xl font-semibold mb-2">PromptPackを作成</h2>
                    <p className="text-[var(--muted)] max-w-md mx-auto">
                        PromptPackはRunwayやSunoで使用するプロンプトをまとめたものです。
                        World Bibleと連動して、一貫したスタイルを維持できます。
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {series.promptPacks.map((pack) => (
                        <PromptPackEditor
                            key={pack.id}
                            promptPack={pack}
                            seriesId={id}
                        />
                    ))}
                </div>
            )}

            {/* Help */}
            <div className="mt-8 glass rounded-xl p-5">
                <h3 className="font-medium mb-3">💡 PromptPack 活用のヒント</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-[var(--muted)]">
                    <div>
                        <strong className="text-white">Runway用:</strong>
                        <p>ビジュアルスタイル、カメラワーク、ライティング指示</p>
                    </div>
                    <div>
                        <strong className="text-white">Suno用:</strong>
                        <p>ジャンル、ムード、楽器構成、歌詞テンプレート</p>
                    </div>
                    <div className="col-span-2">
                        <strong className="text-white">変数を使う:</strong>
                        <p>{"{{scene}}"} のような変数を使って、エピソードごとにカスタマイズ可能</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
