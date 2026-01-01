import Link from "next/link";
import { prisma } from "@/lib/db";
import { createItem } from "./actions";

const ITEM_STATUSES = [
    { value: "draft", label: "下書き" },
    { value: "active", label: "進行中" },
    { value: "paused", label: "保留" },
    { value: "archived", label: "アーカイブ" },
];

type SearchParams = {
    q?: string;
    status?: string;
    template?: string;
};

function safeParseTags(value: string) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default async function ProductionOsPage({
    searchParams,
}: {
    searchParams?: SearchParams;
}) {
    const query = searchParams?.q?.trim() || "";
    const status = searchParams?.status || "";
    const template = searchParams?.template || "";

    const where = {
        ...(status ? { status } : {}),
        ...(template ? { templateId: template } : {}),
        ...(query
            ? {
                  OR: [
                      { title: { contains: query } },
                      { inputText: { contains: query } },
                  ],
              }
            : {}),
    };

    const [items, templates, stats] = await Promise.all([
        prisma.item.findMany({
            where,
            include: {
                template: true,
                jobRuns: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.template.findMany({ orderBy: { updatedAt: "desc" } }),
        Promise.all([
            prisma.item.count(),
            prisma.template.count(),
            prisma.asset.count({ where: { source: "production-os" } }),
        ]),
    ]);

    const [itemCount, templateCount, assetCount] = stats;

    return (
        <div className="space-y-8 p-8 animate-fade-in">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                        Production OS MVP
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-white">制作オペレーションの統合</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Item → JobRun → Artifact を起点に、外部ツールと再現性を管理します。
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-full border border-gray-800 bg-gray-900/60 px-4 py-2 text-xs text-gray-400">
                        Items <span className="ml-1 text-white">{itemCount}</span>
                    </div>
                    <div className="rounded-full border border-gray-800 bg-gray-900/60 px-4 py-2 text-xs text-gray-400">
                        Templates <span className="ml-1 text-white">{templateCount}</span>
                    </div>
                    <div className="rounded-full border border-gray-800 bg-gray-900/60 px-4 py-2 text-xs text-gray-400">
                        Assets <span className="ml-1 text-white">{assetCount}</span>
                    </div>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <section className="space-y-6">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
                        <form className="flex flex-wrap gap-3" method="get">
                            <input
                                name="q"
                                defaultValue={query}
                                placeholder="Item検索 (タイトル/入力)"
                                className="flex-1 min-w-[200px] rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                            />
                            <select
                                name="status"
                                defaultValue={status}
                                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                            >
                                <option value="">すべての状態</option>
                                {ITEM_STATUSES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="template"
                                defaultValue={template}
                                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                            >
                                <option value="">すべてのテンプレ</option>
                                {templates.map((tpl) => (
                                    <option key={tpl.id} value={tpl.id}>
                                        {tpl.name}
                                    </option>
                                ))}
                            </select>
                            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                                検索
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/40 p-8 text-center text-sm text-gray-500">
                                Itemがまだありません。右のフォームから最初のItemを作成しましょう。
                            </div>
                        ) : (
                            items.map((item) => {
                                const tags = safeParseTags(item.tags);
                                const latestRun = item.jobRuns[0];
                                return (
                                    <Link
                                        key={item.id}
                                        href={`/production-os/items/${item.id}`}
                                        className="block rounded-2xl border border-gray-800 bg-gray-900/60 p-5 transition hover:border-indigo-500/50"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {item.template?.name || "テンプレ未設定"}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
                                                {ITEM_STATUSES.find((status) => status.value === item.status)
                                                    ?.label || item.status}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {tags.length > 0 ? (
                                                tags.map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-400"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-600">タグ未設定</span>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                最終実行: {latestRun ? latestRun.status : "未実行"}
                                            </span>
                                            <span className="text-gray-600">→ 詳細を見る</span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </section>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
                        <h2 className="text-lg font-semibold text-white">新しいItem</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            1件の制作単位を作成して、入力→実行→成果物を紐付けます。
                        </p>
                        <form action={createItem} className="mt-4 space-y-3">
                            <input
                                name="title"
                                placeholder="Itemタイトル"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                required
                            />
                            <select
                                name="status"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                defaultValue="draft"
                            >
                                {ITEM_STATUSES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="templateId"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                                defaultValue=""
                            >
                                <option value="">テンプレ未設定</option>
                                {templates.map((tpl) => (
                                    <option key={tpl.id} value={tpl.id}>
                                        {tpl.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                name="tags"
                                placeholder="タグ (カンマ区切り)"
                                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                            />
                            <textarea
                                name="inputText"
                                placeholder="入力テキスト / 台本 / 指示"
                                className="h-28 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                            />
                            <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                                Itemを作成
                            </button>
                        </form>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 text-xs text-gray-500">
                        <p className="text-white">ショートカット</p>
                        <div className="mt-3 space-y-2">
                            <Link href="/production-os/templates" className="block hover:text-white">
                                テンプレ管理 →
                            </Link>
                            <Link href="/production-os/assets" className="block hover:text-white">
                                Asset登録 →
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
