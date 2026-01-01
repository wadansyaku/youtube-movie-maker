import Link from "next/link";
import { prisma } from "@/lib/db";
import { createAsset } from "../actions";

function formatSize(bytes?: number | null) {
  if (!bytes) return "-";
  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${sizes[index]}`;
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric"
  });
}

function safeParseMetadata(value: string) {
  try {
    return JSON.parse(value) as { tags?: string[]; role?: string | null };
  } catch {
    return {};
  }
}

export default async function ProductionAssetsPage() {
  const assets = await prisma.asset.findMany({
    where: { source: "production-os" },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
            ← Production OS
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">Asset登録</h1>
          <p className="text-sm text-[var(--muted)]">
            Production OS専用の素材をアップロードしてItemに紐付けます。
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <section className="space-y-4">
          {assets.length === 0 ? (
            <div className="panel-soft p-8 text-center text-sm text-[var(--muted)]">
              まだAssetがありません。右のフォームからアップロードしてください。
            </div>
          ) : (
            assets.map((asset) => {
              const metadata = safeParseMetadata(asset.metadata || "{}");
              const tags = metadata.tags || [];
              return (
                <div key={asset.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--text)]">{asset.fileName}</h2>
                      <p className="text-xs text-[var(--muted)]">
                        {asset.type} · {formatSize(asset.fileSize)} · {formatDate(asset.createdAt)}
                      </p>
                    </div>
                    {metadata.role && <span className="chip chip-strong">{metadata.role}</span>}
                  </div>
                  <p className="mt-2 break-all text-xs text-[var(--muted)]">{asset.filePath}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <span key={tag} className="chip">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--muted)]">タグ未設定</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        <aside className="panel p-5">
          <h2 className="text-lg font-semibold text-[var(--text)]">新規アップロード</h2>
          <form action={createAsset} className="mt-4 space-y-3" encType="multipart/form-data">
            <div>
              <label className="text-xs text-[var(--muted)]">ファイル</label>
              <input
                name="file"
                type="file"
                className="mt-1 w-full text-xs text-[var(--text)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#0d9488]"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">タグ</label>
              <input name="tags" placeholder="タグ (カンマ区切り)" className="input" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">役割</label>
              <input name="role" placeholder="BGM / SFX / 参考素材" className="input" />
            </div>
            <button className="button-primary w-full">Upload</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
