import Link from "next/link";
import { prisma } from "@/lib/db";
import { createTemplate } from "../actions";
import type { ProductionStep } from "@/lib/production-os/types";
import TemplateForm from "@/components/TemplateForm";

const CONFIG_PLACEHOLDER = `{\n  \"outputFormat\": \"mp4\",\n  \"aspectRatio\": \"9:16\",\n  \"fps\": 30\n}`;

function safeParseJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
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

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
            ← Production OS
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">テンプレート管理</h1>
          <p className="text-sm text-[var(--muted)]">
            Templateの切り替えだけで出力フォーマットを量産できます。
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <section className="space-y-4">
          {templates.length === 0 ? (
            <div className="panel-soft p-8 text-center text-sm text-[var(--muted)]">
              テンプレートがありません。右のフォームから追加してください。
            </div>
          ) : (
            templates.map((template) => {
              const steps = safeParseSteps(template.steps);
              return (
                <div key={template.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text)]">{template.name}</h2>
                      <p className="text-xs text-[var(--muted)]">{template.format}</p>
                    </div>
                    <span className="chip chip-strong">steps {steps.length}</span>
                  </div>
                  {template.description && (
                    <p className="mt-2 text-sm text-[var(--muted)]">{template.description}</p>
                  )}
                  <div className="mt-4 space-y-2">
                    {steps.length === 0 ? (
                      <p className="text-xs text-[var(--muted)]">steps未設定</p>
                    ) : (
                      steps.map((step, index) => (
                        <div key={step.id || index} className="rounded-xl border border-[var(--border)] bg-white/70 p-3">
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
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
                    <Link href={`/templates/${template.id}`} className="button-outline">
                      編集する
                    </Link>
                    <details className="text-xs text-[var(--muted)]">
                    <summary className="cursor-pointer">詳細JSONを見る</summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] text-[var(--muted)]">config</p>
                        <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-[#f8f4ef] p-3 text-[11px] text-[var(--text)]">
                          {safeParseJson(template.config)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--muted)]">steps</p>
                        <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-[#f8f4ef] p-3 text-[11px] text-[var(--text)]">
                          {safeParseJson(template.steps)}
                        </pre>
                      </div>
                    </div>
                    </details>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <aside className="panel p-5">
          <h2 className="text-lg font-semibold text-[var(--text)]">新規テンプレート</h2>
          <div className="mt-4">
            <TemplateForm
              action={createTemplate}
              submitLabel="テンプレート作成"
              configPlaceholder={CONFIG_PLACEHOLDER}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
