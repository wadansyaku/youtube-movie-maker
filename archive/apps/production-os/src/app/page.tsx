import Link from "next/link";
import { prisma } from "@/lib/db";
import { createItem } from "./actions";

const ITEM_STATUSES = [
  { value: "draft", label: "下書き" },
  { value: "active", label: "進行中" },
  { value: "paused", label: "保留" },
  { value: "archived", label: "アーカイブ" }
];

const RUN_STATUS_STYLE: Record<string, { label: string; className: string }> = {
  queued: { label: "待機中", className: "badge badge-warn" },
  running: { label: "実行中", className: "badge badge-warn" },
  succeeded: { label: "成功", className: "badge badge-success" },
  failed: { label: "失敗", className: "badge badge-danger" }
};

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

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric"
  });
}

export default async function ProductionOsPage({
  searchParams
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
          OR: [{ title: { contains: query } }, { inputText: { contains: query } }]
        }
      : {})
  };

  const [items, templates, itemCount, templateCount, assetCount, runCount, failedRuns] =
    await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          template: true,
          jobRuns: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.template.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.item.count(),
      prisma.template.count(),
      prisma.asset.count({ where: { source: "production-os" } }),
      prisma.jobRun.count(),
      prisma.jobRun.count({ where: { status: "failed" } })
    ]);

  const runHealth = runCount > 0 ? Math.round(((runCount - failedRuns) / runCount) * 100) : 0;

  return (
    <div className="space-y-10">
      <section className="panel relative overflow-hidden p-8 fade-in-up">
        <div className="absolute -right-16 top-8 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
              Production OS MVP
            </p>
            <h1 className="text-3xl font-semibold text-[var(--text)]">
              再現可能な制作オペレーションを設計する
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Item → JobRun → Artifact の流れを固定し、外部ツールの差し替えと再実行性を担保します。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/templates" className="button-outline">
              テンプレ設計
            </Link>
            <Link href="/assets" className="button-outline">
              Asset登録
            </Link>
            <Link href="#new-item" className="button-primary">
              Item作成
            </Link>
          </div>
        </div>
        <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">Items</p>
            <p className="text-2xl font-semibold text-[var(--text)]">{itemCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">Templates</p>
            <p className="text-2xl font-semibold text-[var(--text)]">{templateCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">Assets</p>
            <p className="text-2xl font-semibold text-[var(--text)]">{assetCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">Run Health</p>
            <p className="text-2xl font-semibold text-[var(--text)]">{runHealth}%</p>
            <p className="text-[11px] text-[var(--muted)]">失敗率: {failedRuns}</p>
          </div>
        </div>
        <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              title: "1. テンプレを整備",
              desc: "外部ツールstepsと出力形式を定義"
            },
            {
              title: "2. Itemに入力を集約",
              desc: "素材・台本・参照をまとめる"
            },
            {
              title: "3. JobRunで実行",
              desc: "ログと成果物を自動保存"
            }
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm"
            >
              <p className="font-semibold text-[var(--text)]">{step.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <div className="panel-soft p-5">
            <form className="flex flex-wrap items-center gap-3" method="get">
              <input
                name="q"
                defaultValue={query}
                placeholder="Item検索 (タイトル/入力)"
                className="input min-w-[200px] flex-1"
                aria-label="Item検索"
              />
              <select
                name="status"
                defaultValue={status}
                className="input w-40"
                aria-label="ステータスフィルタ"
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
                className="input w-48"
                aria-label="テンプレートフィルタ"
              >
                <option value="">すべてのテンプレ</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
              <button className="button-primary">検索</button>
            </form>
          </div>

          <div className="space-y-4 stagger">
            {items.length === 0 ? (
              <div className="panel-soft p-8 text-center text-sm text-[var(--muted)]">
                Itemがまだありません。右のフォームから最初のItemを作成しましょう。
              </div>
            ) : (
              items.map((item, index) => {
                const tags = safeParseTags(item.tags);
                const latestRun = item.jobRuns[0];
                const runStyle = latestRun
                  ? RUN_STATUS_STYLE[latestRun.status] || RUN_STATUS_STYLE.queued
                  : { label: "未実行", className: "badge badge-neutral" };

                return (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="card p-5 fade-in-up"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--text)]">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {item.template?.name || "テンプレ未設定"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={runStyle.className}>{runStyle.label}</span>
                        <span className="chip">
                          {ITEM_STATUSES.find((status) => status.value === item.status)?.label ||
                            item.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map((tag: string) => (
                          <span key={tag} className="chip">
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[var(--muted)]">タグ未設定</span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>更新: {formatDate(item.updatedAt)}</span>
                      <span>→ 詳細を見る</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div id="new-item" className="panel p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">新しいItem</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              1件の制作単位を作成して、入力→実行→成果物を紐付けます。
            </p>
            <form action={createItem} className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-[var(--muted)]">タイトル</label>
                <input
                  name="title"
                  placeholder="Itemタイトル"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">ステータス</label>
                <select name="status" className="input" defaultValue="draft">
                  {ITEM_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">テンプレート</label>
                <select name="templateId" className="input" defaultValue="">
                  <option value="">テンプレ未設定</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">タグ</label>
                <input name="tags" placeholder="タグ (カンマ区切り)" className="input" />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">入力テキスト</label>
                <textarea
                  name="inputText"
                  placeholder="入力テキスト / 台本 / 指示"
                  className="input h-28"
                />
              </div>
              <button className="button-primary w-full">Itemを作成</button>
            </form>
          </div>

          <div className="panel-soft p-5 text-xs text-[var(--muted)]">
            <p className="text-[var(--text)]">ショートカット</p>
            <div className="mt-3 space-y-2">
              <Link href="/templates" className="block hover:text-[var(--accent)]">
                テンプレ管理 →
              </Link>
              <Link href="/assets" className="block hover:text-[var(--accent)]">
                Asset登録 →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
