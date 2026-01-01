import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateTemplate } from "../../actions";
import TemplateForm from "@/components/TemplateForm";
import type { ProductionStep } from "@/lib/production-os/types";

function safeParseConfig(value: string) {
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

export default async function TemplateDetailPage({
  params
}: {
  params: { id: string };
}) {
  const template = await prisma.template.findUnique({
    where: { id: params.id }
  });

  if (!template) {
    notFound();
  }

  const steps = safeParseSteps(template.steps);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/templates" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
            ← テンプレート一覧
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">{template.name}</h1>
          <p className="text-sm text-[var(--muted)]">stepsをGUIで編集できます。</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <section className="panel p-6">
          <TemplateForm
            action={updateTemplate}
            submitLabel="テンプレートを更新"
            initial={{
              id: template.id,
              name: template.name,
              format: template.format,
              description: template.description || "",
              config: safeParseConfig(template.config),
              steps
            }}
          />
        </section>

        <aside className="panel-soft p-6 text-sm text-[var(--muted)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">補足</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4">
            <li>stepsの順序がそのまま実行順になります。</li>
            <li>paramsは key=value 形式で記述します。</li>
            <li>変更後のJobRunは新しいstepsで実行されます。</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
