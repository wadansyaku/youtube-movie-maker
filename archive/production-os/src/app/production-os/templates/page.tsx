import Link from "next/link";
import { prisma } from "@/lib/db";
import { createTemplate } from "../actions";

const STEPS_PLACEHOLDER = `[
  {
    "id": "step-1",
    "type": "external_call",
    "tool": "runway",
    "name": "動画生成",
    "params": { "mode": "text-to-video" }
  },
  {
    "id": "step-2",
    "type": "external_call",
    "tool": "capcut",
    "name": "自動編集",
    "params": { "preset": "shorts" }
  }
]`;

const CONFIG_PLACEHOLDER = `{
  "outputFormat": "mp4",
  "aspectRatio": "9:16",
  "fps": 30
}`;

function safeParseJson(value: string) {
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return value;
    }
}

export default async function TemplatesPage() {
    const templates = await prisma.template.findMany({
        orderBy: { updatedAt: "desc" },
    });

    return (
        <div className="space-y-8 p-8 animate-fade-in">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <Link href="/production-os" className="text-xs text-gray-500 hover:text-white">
                        ← Production OS
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-white">テンプレート管理</h1>
                    <p className="text-sm text-gray-400">
                        Templateの切り替えだけで出力フォーマットを量産できます。
                    </p>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                <section className="space-y-4">
                    {templates.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/40 p-8 text-center text-sm text-gray-500">
                            テンプレートがありません。右のフォームから追加してください。
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div
                                key={template.id}
                                className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">{template.name}</h2>
                                        <p className="text-xs text-gray-500">{template.format}</p>
                                    </div>
                                </div>
                                {template.description && (
                                    <p className="mt-2 text-sm text-gray-400">{template.description}</p>
                                )}
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-gray-500">config</p>
                                        <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-gray-300">
                                            {safeParseJson(template.config)}
                                        </pre>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">steps</p>
                                        <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-gray-300">
                                            {safeParseJson(template.steps)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <aside className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
                    <h2 className="text-lg font-semibold text-white">新規テンプレート</h2>
                    <form action={createTemplate} className="mt-4 space-y-3">
                        <input
                            name="name"
                            placeholder="テンプレ名"
                            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                            required
                        />
                        <input
                            name="format"
                            placeholder="format (shorts / long / clip)"
                            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                        />
                        <input
                            name="description"
                            placeholder="説明 (任意)"
                            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                        />
                        <textarea
                            name="config"
                            placeholder={CONFIG_PLACEHOLDER}
                            className="h-32 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                        />
                        <textarea
                            name="steps"
                            placeholder={STEPS_PLACEHOLDER}
                            className="h-48 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                        />
                        <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                            テンプレート作成
                        </button>
                    </form>
                </aside>
            </div>
        </div>
    );
}
