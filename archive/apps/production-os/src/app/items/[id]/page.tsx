import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import KpiSparkline from "@/components/KpiSparkline";
import {
  updateItem,
  createJobRun,
  rerunJobRun,
  addReference,
  deleteReference,
  linkAssetToItem,
  unlinkAssetFromItem,
  updateArtifactKpi
} from "../../actions";
import type { ProductionStep, ProductionSnapshot } from "@/lib/production-os/types";

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

type KpiData = {
  views: number | null;
  ctr: number | null;
  watchTime: number | null;
  memo?: string | null;
};

function safeParseTags(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseSteps(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as ProductionStep[]) : [];
  } catch {
    return [];
  }
}

function safeParseSnapshot(value: string) {
  try {
    return JSON.parse(value) as ProductionSnapshot;
  } catch {
    return null;
  }
}

function parseStepLogs(log: string) {
  const entries: Record<number, { request?: Record<string, unknown>; response?: Record<string, unknown> }> = {};
  const lines = log.split("\n");

  lines.forEach((line) => {
    const trimmed = line.trim();
    const match = trimmed.match(/STEP (\d+) (REQUEST|RESPONSE) (\{.*\})$/);
    if (!match) return;
    const index = Number(match[1]);
    const type = match[2];
    try {
      const payload = JSON.parse(match[3]) as Record<string, unknown>;
      if (!entries[index]) entries[index] = {};
      if (type === "REQUEST") {
        entries[index].request = payload;
      } else {
        entries[index].response = payload;
      }
    } catch {
      // Ignore malformed log payloads
    }
  });

  return entries;
}

function parseKpiNote(value?: string | null): KpiData | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<KpiData>;
    return {
      views: typeof parsed.views === "number" ? parsed.views : null,
      ctr: typeof parsed.ctr === "number" ? parsed.ctr : null,
      watchTime: typeof parsed.watchTime === "number" ? parsed.watchTime : null,
      memo: parsed.memo ?? null
    };
  } catch {
    return { views: null, ctr: null, watchTime: null, memo: value };
  }
}

function hasKpiData(kpi: KpiData | null) {
  if (!kpi) return false;
  return kpi.views !== null || kpi.ctr !== null || kpi.watchTime !== null || Boolean(kpi.memo);
}

function formatDelta(current: number | null | undefined, previous: number | null | undefined, digits = 0) {
  if (typeof current !== "number" || typeof previous !== "number") return null;
  const diff = current - previous;
  const value = diff === 0 ? "±0" : `${diff > 0 ? "+" : ""}${diff.toFixed(digits)}`;
  const tone =
    diff > 0 ? "text-[var(--accent)]" : diff < 0 ? "text-[#b91c1c]" : "text-[var(--muted)]";
  return { value, tone };
}

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

export default async function ProductionItemDetail({
  params
}: {
  params: { id: string };
}) {
  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      template: true,
      assets: {
        include: { asset: true },
        orderBy: { orderIndex: "asc" }
      },
      references: { orderBy: { createdAt: "desc" } },
      artifacts: { orderBy: { createdAt: "desc" } },
      jobRuns: {
        orderBy: { createdAt: "desc" },
        include: { template: true, artifacts: true }
      }
    }
  });

  if (!item) {
    notFound();
  }

  const [templates, assets] = await Promise.all([
    prisma.template.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.asset.findMany({
      where: { source: "production-os" },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const tags = safeParseTags(item.tags);
  const templateOptions = templates.length > 0 ? templates : item.template ? [item.template] : [];
  const defaultTemplateId = item.templateId || templateOptions[0]?.id || "";
  const latestRun = item.jobRuns[0];
  const latestArtifact = item.artifacts[0];
  const runStyle = latestRun
    ? RUN_STATUS_STYLE[latestRun.status] || RUN_STATUS_STYLE.queued
    : { label: "未実行", className: "badge badge-neutral" };
  const steps = item.template ? safeParseSteps(item.template.steps) : [];
  const itemKpi = parseKpiNote(item.kpiNote);
  const artifactKpi = parseKpiNote(latestArtifact?.kpiNote || null);
  const displayKpi = hasKpiData(itemKpi) ? itemKpi : artifactKpi;
  const kpiHistory = item.artifacts
    .slice()
    .reverse()
    .map((artifact) => ({
      createdAt: artifact.createdAt,
      kpi: parseKpiNote(artifact.kpiNote)
    }))
    .filter((entry) => entry.kpi && hasKpiData(entry.kpi));
  const trendWindow = kpiHistory.slice(-8);
  const latestTrend = trendWindow[trendWindow.length - 1]?.kpi ?? null;
  const previousTrend = trendWindow.length > 1 ? trendWindow[trendWindow.length - 2]?.kpi ?? null : null;
  const viewsSeries = trendWindow.map((entry) => entry.kpi?.views ?? null);
  const ctrSeries = trendWindow.map((entry) => entry.kpi?.ctr ?? null);
  const watchSeries = trendWindow.map((entry) => entry.kpi?.watchTime ?? null);
  const viewsDelta = formatDelta(latestTrend?.views, previousTrend?.views);
  const ctrDelta = formatDelta(latestTrend?.ctr, previousTrend?.ctr, 2);
  const watchDelta = formatDelta(latestTrend?.watchTime, previousTrend?.watchTime, 1);
  const latestTrendDate = trendWindow[trendWindow.length - 1]?.createdAt;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
            ← Production OS
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">{item.title}</h1>
          <p className="text-sm text-[var(--muted)]">
            入力・実行履歴・成果物・参照情報をひと目で追跡します。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={createJobRun} className="flex items-center gap-2">
            <input type="hidden" name="itemId" value={item.id} />
            <select name="templateId" defaultValue={defaultTemplateId} className="input">
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
            <button className="button-primary" disabled={!defaultTemplateId}>
              実行
            </button>
          </form>
          <Link href="/templates" className="button-outline">
            テンプレ管理
          </Link>
        </div>
      </header>

      <section className="panel p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">ステータス</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">
              {ITEM_STATUSES.find((status) => status.value === item.status)?.label || item.status}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">最新JobRun</p>
            <div className="mt-2">
              <span className={runStyle.className}>{runStyle.label}</span>
              <p className="mt-1 text-xs text-[var(--muted)]">{formatDate(latestRun?.createdAt)}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">成果物</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">
              {item.artifacts.length} 件
            </p>
            <p className="text-xs text-[var(--muted)]">最新: {formatDate(latestArtifact?.createdAt)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">素材</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">
              {item.assets.length} 件
            </p>
            <p className="text-xs text-[var(--muted)]">タグ: {tags.length} 件</p>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">KPIサマリー</h2>
          <span className="text-xs text-[var(--muted)]">
            {displayKpi ? "最新のKPIを表示" : "KPI未入力"}
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">Views</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
              {displayKpi?.views ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">CTR</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
              {displayKpi?.ctr !== null && displayKpi?.ctr !== undefined ? `${displayKpi.ctr}%` : "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs text-[var(--muted)]">Watch Time (min)</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
              {displayKpi?.watchTime ?? "-"}
            </p>
          </div>
        </div>
        {displayKpi?.memo && (
          <p className="mt-3 text-xs text-[var(--muted)]">メモ: {displayKpi.memo}</p>
        )}
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--muted)]">KPIトレンド (直近{trendWindow.length}件)</p>
            <p className="text-[11px] text-[var(--muted)]">最終更新: {formatDate(latestTrendDate)}</p>
          </div>
          {trendWindow.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--muted)]">KPI履歴がまだありません。</p>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--muted)]">Views</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                      {latestTrend?.views ?? "-"}
                    </p>
                    {viewsDelta && (
                      <p className={`mt-1 text-[11px] ${viewsDelta.tone}`}>前回比 {viewsDelta.value}</p>
                    )}
                  </div>
                  <div className="w-28">
                    <KpiSparkline values={viewsSeries} />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--muted)]">CTR</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                      {latestTrend?.ctr !== null && latestTrend?.ctr !== undefined ? `${latestTrend.ctr}%` : "-"}
                    </p>
                    {ctrDelta && (
                      <p className={`mt-1 text-[11px] ${ctrDelta.tone}`}>前回比 {ctrDelta.value}%</p>
                    )}
                  </div>
                  <div className="w-28">
                    <KpiSparkline values={ctrSeries} />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--muted)]">Watch Time</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                      {latestTrend?.watchTime ?? "-"}
                      {latestTrend?.watchTime !== null && latestTrend?.watchTime !== undefined ? " min" : ""}
                    </p>
                    {watchDelta && (
                      <p className={`mt-1 text-[11px] ${watchDelta.tone}`}>前回比 {watchDelta.value} min</p>
                    )}
                  </div>
                  <div className="w-28">
                    <KpiSparkline values={watchSeries} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">入力・設定</h2>
            <form action={updateItem} className="mt-4 space-y-3">
              <input type="hidden" name="itemId" value={item.id} />
              <div>
                <label className="text-xs text-[var(--muted)]">タイトル</label>
                <input name="title" defaultValue={item.title} className="input" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-[var(--muted)]">ステータス</label>
                  <select name="status" defaultValue={item.status} className="input">
                    {ITEM_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">テンプレート</label>
                  <select name="templateId" defaultValue={item.templateId || ""} className="input">
                    <option value="">テンプレ未設定</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">タグ</label>
                <input name="tags" defaultValue={tags.join(", ")} className="input" />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">入力テキスト</label>
                <textarea
                  name="inputText"
                  defaultValue={item.inputText || ""}
                  className="input h-32"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">KPIメモ</label>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    name="kpiViews"
                    defaultValue={itemKpi?.views ?? ""}
                    className="input"
                    type="number"
                    placeholder="Views"
                  />
                  <input
                    name="kpiCtr"
                    defaultValue={itemKpi?.ctr ?? ""}
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="CTR (%)"
                  />
                  <input
                    name="kpiWatchTime"
                    defaultValue={itemKpi?.watchTime ?? ""}
                    className="input"
                    type="number"
                    step="0.1"
                    placeholder="Watch Time (min)"
                  />
                </div>
                <textarea
                  name="kpiMemo"
                  defaultValue={itemKpi?.memo ?? ""}
                  className="input mt-3 h-20"
                  placeholder="KPIメモ"
                />
              </div>
              <button className="button-primary">更新</button>
            </form>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">実行履歴</h2>
              <span className="text-xs text-[var(--muted)]">失敗時もログとスナップショットを保存</span>
            </div>
            <div className="mt-4 space-y-3">
              {item.jobRuns.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">まだ実行履歴がありません。</p>
              ) : (
                item.jobRuns.map((run) => {
                  const style = RUN_STATUS_STYLE[run.status] || RUN_STATUS_STYLE.queued;
                  const snapshot = safeParseSnapshot(run.inputSnapshot || "");
                  const snapshotSteps = snapshot?.steps ?? [];
                  const snapshotTemplate = snapshot?.template;
                  const snapshotAssetsCount = snapshot?.assets?.length ?? 0;
                  const snapshotRefsCount = snapshot?.references?.length ?? 0;
                  const stepLogs = parseStepLogs(run.log || "");
                  const toolList = snapshotSteps
                    .map((step) => step.tool)
                    .filter((tool): tool is string => Boolean(tool));
                  const tools = Array.from(new Set(toolList));
                  const templateChanged =
                    snapshotTemplate?.id &&
                    item.templateId &&
                    snapshotTemplate.id !== item.templateId;
                  return (
                    <div key={run.id} className="rounded-xl border border-[var(--border)] bg-white/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">
                            {snapshotTemplate?.name || run.template?.name || "テンプレなし"}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {formatDate(run.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={style.className}>{style.label}</span>
                          <form action={rerunJobRun}>
                            <input type="hidden" name="jobRunId" value={run.id} />
                            <button className="button-outline">再実行</button>
                          </form>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <div className="rounded-lg border border-[var(--border)] bg-white/80 p-3 text-xs text-[var(--muted)]">
                          <p className="font-semibold text-[var(--text)]">Input Snapshot</p>
                          <p className="mt-1">Assets: {snapshotAssetsCount}</p>
                          <p>Refs: {snapshotRefsCount}</p>
                        </div>
                        <div className="rounded-lg border border-[var(--border)] bg-white/80 p-3 text-xs text-[var(--muted)]">
                          <p className="font-semibold text-[var(--text)]">Tools</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {tools.length > 0 ? (
                              tools.map((tool) => (
                                <span key={tool} className="chip">
                                  {tool}
                                </span>
                              ))
                            ) : (
                              <span>未設定</span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-lg border border-[var(--border)] bg-white/80 p-3 text-xs text-[var(--muted)]">
                          <p className="font-semibold text-[var(--text)]">Template Drift</p>
                          <p className="mt-1">{templateChanged ? "更新あり" : "変更なし"}</p>
                          {templateChanged && (
                            <p className="text-[11px]">現在のテンプレと一致しません</p>
                          )}
                        </div>
                      </div>
                      <details className="mt-3 text-xs text-[var(--muted)]">
                        <summary className="cursor-pointer">ステップを確認</summary>
                        <div className="mt-2 space-y-2">
                          {snapshotSteps.length === 0 ? (
                            <p className="text-xs text-[var(--muted)]">stepsが記録されていません。</p>
                          ) : (
                            snapshotSteps.map((step, index) => {
                              const stepLog = stepLogs[index + 1];
                              const responseStatus = stepLog?.response?.status;
                              const failed = responseStatus === "error";
                              const completed = responseStatus === "ok";
                              const statusLabel = failed
                                ? "失敗"
                                : completed
                                ? "完了"
                                : run.status === "failed"
                                ? "未完了"
                                : "待機";
                              const statusClass = failed
                                ? "badge badge-danger"
                                : completed
                                ? "badge badge-success"
                                : "badge badge-neutral";
                              return (
                                <div
                                  key={step.id || index}
                                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white/70 p-2"
                                >
                                  <div>
                                    <p className="text-xs font-semibold text-[var(--text)]">
                                      {index + 1}. {step.name || step.type}
                                    </p>
                                    <p className="text-[11px] text-[var(--muted)]">
                                      {step.tool ? `${step.type} / ${step.tool}` : step.type}
                                    </p>
                                  </div>
                                  <span className={statusClass}>{statusLabel}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </details>
                      <details className="mt-3 text-xs text-[var(--muted)]">
                        <summary className="cursor-pointer">外部ツールログ</summary>
                        <div className="mt-2 space-y-3">
                          {snapshotSteps.length === 0 ? (
                            <p className="text-xs text-[var(--muted)]">stepsが記録されていません。</p>
                          ) : (
                            snapshotSteps.map((step, index) => {
                              const logEntry = stepLogs[index + 1] || {};
                              return (
                                <div key={step.id || index} className="rounded-lg border border-[var(--border)] bg-white/70 p-3">
                                  <p className="text-xs font-semibold text-[var(--text)]">
                                    STEP {index + 1}: {step.name || step.type}
                                  </p>
                                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <div>
                                      <p className="text-[11px] text-[var(--muted)]">Request</p>
                                      <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-[#f8f4ef] p-2 text-[11px] text-[var(--text)]">
                                        {logEntry.request ? JSON.stringify(logEntry.request, null, 2) : "記録なし"}
                                      </pre>
                                    </div>
                                    <div>
                                      <p className="text-[11px] text-[var(--muted)]">Response</p>
                                      <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-[#f8f4ef] p-2 text-[11px] text-[var(--text)]">
                                        {logEntry.response ? JSON.stringify(logEntry.response, null, 2) : "記録なし"}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </details>
                      <details className="mt-3 text-xs text-[var(--muted)]">
                        <summary className="cursor-pointer">ログを見る</summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-[#f8f4ef] p-3 text-[11px] text-[var(--text)]">
                          {run.log || "ログなし"}
                        </pre>
                      </details>
                      <details className="mt-2 text-xs text-[var(--muted)]">
                        <summary className="cursor-pointer">スナップショット</summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-[#f8f4ef] p-3 text-[11px] text-[var(--text)]">
                          {run.inputSnapshot || "スナップショットなし"}
                        </pre>
                      </details>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">成果物</h2>
            <div className="mt-4 space-y-3">
              {item.artifacts.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">成果物はまだありません。</p>
              ) : (
                item.artifacts.map((artifact) => {
                  const artifactKpi = parseKpiNote(artifact.kpiNote);
                  return (
                    <div key={artifact.id} className="rounded-xl border border-[var(--border)] bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">{artifact.name}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {artifact.type} / {formatDate(artifact.createdAt)}
                          </p>
                          <p className="mt-1 break-all text-xs text-[var(--muted)]">{artifact.uri}</p>
                        </div>
                      </div>
                      <form action={updateArtifactKpi} className="mt-3 flex flex-col gap-2">
                        <input type="hidden" name="artifactId" value={artifact.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <div className="grid gap-2 md:grid-cols-3">
                          <input
                            name="kpiViews"
                            defaultValue={artifactKpi?.views ?? ""}
                            className="input"
                            type="number"
                            placeholder="Views"
                          />
                          <input
                            name="kpiCtr"
                            defaultValue={artifactKpi?.ctr ?? ""}
                            className="input"
                            type="number"
                            step="0.01"
                            placeholder="CTR (%)"
                          />
                          <input
                            name="kpiWatchTime"
                            defaultValue={artifactKpi?.watchTime ?? ""}
                            className="input"
                            type="number"
                            step="0.1"
                            placeholder="Watch Time (min)"
                          />
                        </div>
                        <textarea
                          name="kpiMemo"
                          defaultValue={artifactKpi?.memo ?? ""}
                          placeholder="KPIメモ"
                          className="input h-20"
                        />
                        <button className="button-outline self-start">KPI更新</button>
                      </form>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">パイプライン</h2>
            <p className="text-xs text-[var(--muted)]">テンプレに紐づいたstepsを確認</p>
            <div className="mt-4 space-y-2">
              {steps.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">stepsが未定義です。</p>
              ) : (
                steps.map((step, index) => (
                  <div key={step.id || index} className="rounded-lg border border-[var(--border)] bg-white/70 p-3">
                    <p className="text-xs font-semibold text-[var(--text)]">
                      {index + 1}. {step.name || step.type}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {step.tool ? `${step.type} / ${step.tool}` : step.type}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">参照情報</h2>
            <div className="mt-4 space-y-3">
              {item.references.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">参照情報はありません。</p>
              ) : (
                item.references.map((ref) => (
                  <div key={ref.id} className="rounded-lg border border-[var(--border)] bg-white/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{ref.label}</p>
                        {ref.url && <p className="mt-1 break-all text-xs text-[var(--muted)]">{ref.url}</p>}
                        {ref.notes && <p className="mt-1 text-xs text-[var(--muted)]">{ref.notes}</p>}
                      </div>
                      <form action={deleteReference}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="referenceId" value={ref.id} />
                        <button className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">削除</button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form action={addReference} className="mt-4 space-y-2">
              <input type="hidden" name="itemId" value={item.id} />
              <input name="label" placeholder="参照タイトル" className="input" required />
              <input name="url" placeholder="URL (任意)" className="input" />
              <textarea name="notes" placeholder="メモ" className="input h-20" />
              <button className="button-primary w-full">追加</button>
            </form>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">素材</h2>
              <Link href="/assets" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
                Assetへ →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {item.assets.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">紐付いた素材がありません。</p>
              ) : (
                item.assets.map((entry) => (
                  <div key={entry.assetId} className="rounded-lg border border-[var(--border)] bg-white/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{entry.asset.fileName}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {entry.asset.type} {entry.role ? `・${entry.role}` : ""}
                        </p>
                      </div>
                      <form action={unlinkAssetFromItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="assetId" value={entry.assetId} />
                        <button className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">解除</button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form action={linkAssetToItem} className="mt-4 space-y-2">
              <input type="hidden" name="itemId" value={item.id} />
              <select name="assetId" className="input">
                <option value="">Assetを選択</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.fileName}
                  </option>
                ))}
              </select>
              <input name="role" placeholder="役割 (BGM / SFX / 参考画像)" className="input" />
              <button className="button-outline w-full">紐付け</button>
            </form>
          </div>
        </aside>
      </section>
    </div>
  );
}
