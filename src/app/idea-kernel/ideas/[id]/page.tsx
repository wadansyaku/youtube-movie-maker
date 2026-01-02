import Link from "next/link";
import { prisma } from "@/lib/db";
import { AlertTriangle } from "lucide-react";
import SelectIdeaForm from "./SelectIdeaForm";
import EpisodeSpecPanel from "./EpisodeSpecPanel";

const parseJsonArray = <T,>(
    value: string | null | undefined,
    fallback: T[] = []
): T[] => {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
        return fallback;
    }
};

const parseJsonObject = <T extends Record<string, unknown>>(
    value: string | null | undefined,
    fallback: T
): T => {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as T;
        }
    } catch {
        // ignore parse errors
    }
    return fallback;
};

export default async function IdeaKernelDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const idea = await prisma.ideaKernelIdea.findUnique({
        where: { id: params.id },
    });

    if (!idea) {
        return (
            <div className="card p-6 text-center text-gray-400">
                対象のIdeaが見つかりませんでした。
            </div>
        );
    }

    const breakdown = parseJsonObject<
        Record<string, { score: number; reason: string }>
    >(idea.scoreBreakdown, {});
    const similarityTop = parseJsonArray<{
        id: string;
        title: string;
        similarity: number;
        youtubeUrl?: string | null;
    }>(idea.similarityTop);

    const maxSimilarity = similarityTop[0]?.similarity ?? 0;
    const warningLabel =
        maxSimilarity >= 0.6 ? "要注意" : maxSimilarity >= 0.45 ? "注意" : "OK";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{idea.title}</h1>
                    <p className="text-sm text-gray-400">
                        ステータス: <span className="badge">{idea.status}</span>
                    </p>
                </div>
                <Link href="/idea-kernel" className="btn btn-secondary px-4 py-2 text-sm">
                    一覧へ戻る
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="card p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-200">フック</h2>
                    <p className="text-gray-300 jp-text">{idea.hook}</p>
                    <h2 className="text-sm font-semibold text-gray-200">主張</h2>
                    <p className="text-gray-300 jp-text">{idea.claim}</p>
                    <div className="text-xs text-gray-500">
                        Score: {idea.scoreTotal.toFixed(2)} / Novelty: {idea.noveltyScore.toFixed(2)}
                    </div>
                </div>

                <div className="card p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-200">被り判定</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={16} className="text-amber-300" />
                        {warningLabel}（最大類似度 {Math.round(maxSimilarity * 100)}%）
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                        {similarityTop.length === 0 ? (
                            <div className="text-gray-500">過去動画が未登録です。</div>
                        ) : (
                            similarityTop.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-2">
                                    <span className="truncate">{item.title}</span>
                                    <span className="text-xs text-gray-400">
                                        {(item.similarity * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="card p-5 space-y-3">
                <h2 className="text-sm font-semibold text-gray-200">スコア内訳</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(breakdown).map(([axis, info]) => (
                        <div key={axis} className="rounded-lg border border-gray-800 p-3">
                            <div className="text-xs uppercase text-gray-500">{axis}</div>
                            <div className="text-lg font-semibold text-white">{info.score.toFixed(2)}</div>
                            <div className="text-xs text-gray-400">{info.reason}</div>
                        </div>
                    ))}
                </div>
            </div>

            {idea.status !== "SELECTED" ? (
                <SelectIdeaForm ideaId={idea.id} />
            ) : (
                <>
                    <div className="card p-4 text-sm text-gray-300">
                        <div className="font-semibold text-gray-200">採用済み</div>
                        <div className="text-xs text-gray-500">
                            採用日時: {idea.selectedAt?.toISOString().slice(0, 10) ?? "-"}
                        </div>
                        <div className="mt-2 text-gray-300 jp-text">
                            {idea.selectionReason}
                        </div>
                    </div>
                    <EpisodeSpecPanel
                        ideaId={idea.id}
                        episodeSpecJson={idea.episodeSpecJson}
                    />
                </>
            )}
        </div>
    );
}
