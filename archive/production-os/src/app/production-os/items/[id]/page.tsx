import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    updateItem,
    createJobRun,
    rerunJobRun,
    addReference,
    deleteReference,
    linkAssetToItem,
    unlinkAssetFromItem,
    updateArtifactKpi,
} from "../../actions";

const ITEM_STATUSES = [
    { value: "draft", label: "下書き" },
    { value: "active", label: "進行中" },
    { value: "paused", label: "保留" },
    { value: "archived", label: "アーカイブ" },
];

function safeParseTags(value: string) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function formatDate(value: Date) {
    return new Date(value).toLocaleString("ja-JP");
}

export default async function ProductionItemDetail({
    params,
}: {
    params: { id: string };
}) {
    const item = await prisma.item.findUnique({
        where: { id: params.id },
        include: {
            template: true,
            assets: {
                include: { asset: true },
                orderBy: { orderIndex: "asc" },
            },
            references: { orderBy: { createdAt: "desc" } },
            artifacts: { orderBy: { createdAt: "desc" } },
            jobRuns: {
                orderBy: { createdAt: "desc" },
                include: { template: true, artifacts: true },
            },
        },
    });

    if (!item) {
        notFound();
    }

    const [templates, assets] = await Promise.all([
        prisma.template.findMany({ orderBy: { updatedAt: "desc" } }),
        prisma.asset.findMany({
            where: { source: "production-os" },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const tags = safeParseTags(item.tags);
    const templateOptions = templates.length > 0 ? templates : item.template ? [item.template] : [];
    const defaultTemplateId = item.templateId || templateOptions[0]?.id || "";

    return (
        <div className="space-y-8 p-8 animate-fade-in">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <Link href="/production-os" className="text-xs text-gray-500 hover:text-white">
                        ← Production OS
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-white">{item.title}</h1>
                    <p className="text-sm text-gray-400">
                        Item → JobRun → Artifact を一画面で追跡します。
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <form action={createJobRun} className="flex items-center gap-2">
                        <input type="hidden" name="itemId" value={item.id} />
                        <select
                            name="templateId"
                            defaultValue={defaultTemplateId}
                            className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                        >
                            {templateOptions.length === 0 ? (
                                <option value="">テンプレなし</option>
                            ) : (
                                templateOptions.map((tpl) => (
                                    <option key={tpl.id} value={tpl.id}>
                                        {tpl.name}
                                    </option>
                                ))
                            )}
                        </select>
                        <button
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                            disabled={!defaultTemplateId}
                        >
                            実行
                        </button>
                    </form>
                    <Link
                        href="/production-os/templates"
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 transition hover:border-indigo-500/60 hover:text-white"
                    >
                        テンプレ管理
                    </Link>
                </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
                        <h2 className="text-lg font-semibold text-white">入力・設定</h2>
                        <form action={updateItem} className="mt-4 space-y-3">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input
                                name="title"
                                defaultValue={item.title}
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                                <select
                                    name="status"
                                    defaultValue={item.status}
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                >
                                    {ITEM_STATUSES.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="templateId"
                                    defaultValue={item.templateId || ""}
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                >
                                    <option value="">テンプレ未設定</option>
                                    {templates.map((tpl) => (
                                        <option key={tpl.id} value={tpl.id}>
                                            {tpl.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input
                                name="tags"
                                defaultValue={tags.join(", ")}
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                placeholder="タグ (カンマ区切り)"
                            />
                            <textarea
                                name="inputText"
                                defaultValue={item.inputText || ""}
                                className="h-32 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                placeholder="入力テキスト / 台本 / 指示"
                            />
                            <textarea
                                name="kpiNote"
                                defaultValue={item.kpiNote || ""}
                                className="h-20 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                placeholder="KPIメモ (例: views=1200, CTR=3.2%)"
                            />
                            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                                更新
                            </button>
                        </form>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">実行履歴</h2>
                            <span className="text-xs text-gray-500">
                                失敗時もログとスナップショットを保存
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {item.jobRuns.length === 0 ? (
                                <p className="text-sm text-gray-500">まだ実行履歴がありません。</p>
                            ) : (
                                item.jobRuns.map((run) => (
                                    <div
                                        key={run.id}
                                        className="rounded-xl border border-gray-800 bg-gray-950/40 p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    {run.template?.name || "テンプレなし"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(run.createdAt)} / {run.status}
                                                </p>
                                            </div>
                                            <form action={rerunJobRun}>
                                                <input type="hidden" name="jobRunId" value={run.id} />
                                                <button className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-200 transition hover:border-indigo-500/60 hover:text-white">
                                                    再実行
                                                </button>
                                            </form>
                                        </div>
                                        <details className="mt-3 text-xs text-gray-400">
                                            <summary className="cursor-pointer">ログを見る</summary>
                                            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[11px] text-gray-300">
                                                {run.log || "ログなし"}
                                            </pre>
                                        </details>
                                        <details className="mt-2 text-xs text-gray-400">
                                            <summary className="cursor-pointer">スナップショット</summary>
                                            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[11px] text-gray-300">
                                                {run.inputSnapshot || "スナップショットなし"}
                                            </pre>
                                        </details>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
                        <h2 className="text-lg font-semibold text-white">成果物</h2>
                        <div className="mt-4 space-y-3">
                            {item.artifacts.length === 0 ? (
                                <p className="text-sm text-gray-500">成果物はまだありません。</p>
                            ) : (
                                item.artifacts.map((artifact) => (
                                    <div
                                        key={artifact.id}
                                        className="rounded-xl border border-gray-800 bg-gray-950/40 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{artifact.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {artifact.type} / {formatDate(artifact.createdAt)}
                                                </p>
                                                <p className="mt-1 break-all text-xs text-gray-400">
                                                    {artifact.uri}
                                                </p>
                                            </div>
                                        </div>
                                        <form action={updateArtifactKpi} className="mt-3 flex flex-col gap-2">
                                            <input type="hidden" name="artifactId" value={artifact.id} />
                                            <input type="hidden" name="itemId" value={item.id} />
                                            <input
                                                name="kpiNote"
                                                defaultValue={artifact.kpiNote || ""}
                                                placeholder="KPIメモ"
                                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                                            />
                                            <button className="self-start rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-200 transition hover:border-indigo-500/60 hover:text-white">
                                                KPI更新
                                            </button>
                                        </form>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
                        <h2 className="text-lg font-semibold text-white">参照情報</h2>
                        <div className="mt-4 space-y-3">
                            {item.references.length === 0 ? (
                                <p className="text-sm text-gray-500">参照情報はありません。</p>
                            ) : (
                                item.references.map((ref) => (
                                    <div
                                        key={ref.id}
                                        className="rounded-lg border border-gray-800 bg-gray-950/40 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-medium text-white">{ref.label}</p>
                                                {ref.url && (
                                                    <p className="mt-1 break-all text-xs text-gray-400">{ref.url}</p>
                                                )}
                                                {ref.notes && (
                                                    <p className="mt-1 text-xs text-gray-500">{ref.notes}</p>
                                                )}
                                            </div>
                                            <form action={deleteReference}>
                                                <input type="hidden" name="itemId" value={item.id} />
                                                <input type="hidden" name="referenceId" value={ref.id} />
                                                <button className="text-xs text-gray-500 hover:text-white">削除</button>
                                            </form>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <form action={addReference} className="mt-4 space-y-2">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input
                                name="label"
                                placeholder="参照タイトル"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                                required
                            />
                            <input
                                name="url"
                                placeholder="URL (任意)"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                            />
                            <textarea
                                name="notes"
                                placeholder="メモ"
                                className="h-20 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                            />
                            <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500">
                                追加
                            </button>
                        </form>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">素材</h2>
                            <Link href="/production-os/assets" className="text-xs text-gray-500 hover:text-white">
                                Assetへ →
                            </Link>
                        </div>
                        <div className="mt-4 space-y-3">
                            {item.assets.length === 0 ? (
                                <p className="text-sm text-gray-500">紐付いた素材がありません。</p>
                            ) : (
                                item.assets.map((entry) => (
                                    <div
                                        key={entry.assetId}
                                        className="rounded-lg border border-gray-800 bg-gray-950/40 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {entry.asset.fileName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {entry.asset.type} {entry.role ? `・${entry.role}` : ""}
                                                </p>
                                            </div>
                                            <form action={unlinkAssetFromItem}>
                                                <input type="hidden" name="itemId" value={item.id} />
                                                <input type="hidden" name="assetId" value={entry.assetId} />
                                                <button className="text-xs text-gray-500 hover:text-white">解除</button>
                                            </form>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <form action={linkAssetToItem} className="mt-4 space-y-2">
                            <input type="hidden" name="itemId" value={item.id} />
                            <select
                                name="assetId"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                            >
                                <option value="">Assetを選択</option>
                                {assets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.fileName}
                                    </option>
                                ))}
                            </select>
                            <input
                                name="role"
                                placeholder="役割 (BGM / SFX / 参考画像)"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                            />
                            <button className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-200 transition hover:border-indigo-500/60 hover:text-white">
                                紐付け
                            </button>
                        </form>
                    </div>
                </aside>
            </section>
        </div>
    );
}
