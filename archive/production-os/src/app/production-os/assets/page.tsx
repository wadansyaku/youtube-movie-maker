import Link from "next/link";
import { prisma } from "@/lib/db";
import { createAsset } from "../actions";

function formatSize(bytes?: number | null) {
    if (!bytes) return "-";
    const sizes = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${sizes[index]}`;
}

export default async function ProductionAssetsPage() {
    const assets = await prisma.asset.findMany({
        where: { source: "production-os" },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8 p-8 animate-fade-in">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <Link href="/production-os" className="text-xs text-gray-500 hover:text-white">
                        ← Production OS
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-white">Asset登録</h1>
                    <p className="text-sm text-gray-400">
                        Production OS専用の素材をアップロードしてItemに紐付けます。
                    </p>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                <section className="space-y-4">
                    {assets.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/40 p-8 text-center text-sm text-gray-500">
                            まだAssetがありません。右のフォームからアップロードしてください。
                        </div>
                    ) : (
                        assets.map((asset) => (
                            <div
                                key={asset.id}
                                className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">{asset.fileName}</h2>
                                        <p className="text-xs text-gray-500">
                                            {asset.type} · {formatSize(asset.fileSize)}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-2 break-all text-xs text-gray-400">{asset.filePath}</p>
                            </div>
                        ))
                    )}
                </section>

                <aside className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
                    <h2 className="text-lg font-semibold text-white">新規アップロード</h2>
                    <form action={createAsset} className="mt-4 space-y-3" encType="multipart/form-data">
                        <input
                            name="file"
                            type="file"
                            className="w-full text-xs text-gray-300 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
                            required
                        />
                        <input
                            name="tags"
                            placeholder="タグ (カンマ区切り)"
                            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                        />
                        <input
                            name="role"
                            placeholder="役割 (BGM / SFX / 参考素材)"
                            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-100"
                        />
                        <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                            Upload
                        </button>
                    </form>
                </aside>
            </div>
        </div>
    );
}
