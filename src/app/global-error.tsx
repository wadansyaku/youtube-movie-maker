'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#0f0f14] text-white">
                    <h2 className="text-2xl font-bold mb-4 text-red-500">致命的なエラーが発生しました</h2>
                    <p className="text-[var(--muted)] mb-8 max-w-lg">
                        アプリケーションのルートレイアウトでエラーが発生しました。
                    </p>
                    <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-lg mb-8 max-w-2xl w-full overflow-auto">
                        <code className="text-sm text-red-300 font-mono">
                            {error.message || 'Unknown error'}
                        </code>
                    </div>
                    <button
                        onClick={() => reset()}
                        className="btn btn-primary px-6 py-2"
                    >
                        再試行
                    </button>
                </div>
            </body>
        </html>
    );
}
