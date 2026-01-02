import Link from "next/link";
import { prisma } from "@/lib/db";
import { AlertTriangle, Sparkles } from "lucide-react";

interface PageProps {
    searchParams: {
        status?: string;
        minScore?: string;
        minNovelty?: string;
    };
}

const statusOptions = [
    { value: "all", label: "全て" },
    { value: "DRAFT", label: "下書き" },
    { value: "EVALUATED", label: "評価済み" },
    { value: "SELECTED", label: "採用" },
    { value: "ARCHIVED", label: "アーカイブ" },
];

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

const getWarningLevel = (maxSimilarity: number) => {
    if (maxSimilarity >= 0.6) return "warn";
    if (maxSimilarity >= 0.45) return "caution";
    return "safe";
};

export default async function IdeaKernelPage({ searchParams }: PageProps) {
    const status = searchParams.status || "all";
    const minScore = Number(searchParams.minScore || 0);
    const minNovelty = Number(searchParams.minNovelty || 0);

    const where: Record<string, unknown> = {};
    if (status !== "all") where.status = status;
    if (!Number.isNaN(minScore) && minScore > 0) {
        where.scoreTotal = { gte: minScore };
    }
    if (!Number.isNaN(minNovelty) && minNovelty > 0) {
        where.noveltyScore = { gte: minNovelty };
    }

    const ideas = await prisma.ideaKernelIdea.findMany({
        where,
        orderBy: [{ scoreTotal: "desc" }, { createdAt: "desc" }],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Idea Kernel</h1>
                    <p className="text-sm text-gray-400">
                        既出被りを回避しながら企画を評価・採用します。
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/idea-kernel/new" className="btn btn-primary px-4 py-2 text-sm">
                        新規候補の投入
                    </Link>
                    <Link href="/idea-kernel/past-videos" className="btn btn-secondary px-4 py-2 text-sm">
                        過去動画
                    </Link>
                </div>
            </div>

            <div className="card p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <Sparkles size={16} />
                    フィルタ
                </div>
                <form className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <label className="text-xs text-gray-400">ステータス</label>
                        <select name="status" defaultValue={status} className="input mt-2">
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">最低スコア</label>
                        <input
                            name="minScore"
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            defaultValue={minScore || ""}
                            placeholder="例: 3.5"
                            className="input mt-2"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">最低ノベルティ</label>
                        <input
                            name="minNovelty"
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            defaultValue={minNovelty || ""}
                            placeholder="例: 2.5"
                            className="input mt-2"
                        />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="btn btn-primary w-full">
                            適用
                        </button>
                    </div>
                </form>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-800 text-gray-400">
                            <tr>
                                <th className="px-4 py-3 text-left">タイトル</th>
                                <th className="px-4 py-3 text-left">状態</th>
                                <th className="px-4 py-3 text-left">スコア</th>
                                <th className="px-4 py-3 text-left">Novelty</th>
                                <th className="px-4 py-3 text-left">被り判定</th>
                                <th className="px-4 py-3 text-left">最上位類似</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ideas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                        対象のIdeaがありません。
                                    </td>
                                </tr>
                            ) : (
                                ideas.map((idea) => {
                                    const similarityTop = parseJsonArray<{
                                        similarity: number;
                                        title: string;
                                    }>(idea.similarityTop);
                                    const maxSimilarity = similarityTop[0]?.similarity ?? 0;
                                    const warningLevel = getWarningLevel(maxSimilarity);
                                    const warningLabel =
                                        warningLevel === "warn"
                                            ? "要注意"
                                            : warningLevel === "caution"
                                                ? "注意"
                                                : "OK";

                                    return (
                                        <tr key={idea.id} className="border-b border-gray-800 last:border-0">
                                            <td className="px-4 py-3">
                                                <Link href={`/idea-kernel/ideas/${idea.id}`} className="text-indigo-300 hover:text-indigo-200">
                                                    {idea.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="badge">{idea.status}</span>
                                            </td>
                                            <td className="px-4 py-3">{idea.scoreTotal.toFixed(2)}</td>
                                            <td className="px-4 py-3">{idea.noveltyScore.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${warningLevel === "warn"
                                                        ? "bg-red-500/20 text-red-300"
                                                        : warningLevel === "caution"
                                                            ? "bg-amber-500/20 text-amber-200"
                                                            : "bg-emerald-500/20 text-emerald-200"
                                                        }`}
                                                >
                                                    <AlertTriangle size={12} />
                                                    {warningLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {similarityTop.length === 0
                                                    ? "-"
                                                    : `${similarityTop[0].title} (${Math.round(
                                                        maxSimilarity * 100
                                                    )}%)`}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
