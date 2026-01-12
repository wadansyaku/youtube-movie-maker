'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ProductionError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Production page error:', error);
    }, [error]);

    return (
        <div className="p-8">
            <div className="card p-12 text-center max-w-md mx-auto border-red-500/20 bg-red-500/5">
                <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold mb-3 text-white">
                    エラーが発生しました
                </h2>
                <p className="text-gray-400 mb-6 text-sm">
                    投稿管理ページの読み込み中に問題が発生しました。
                    {error.message && (
                        <span className="block mt-2 text-red-400/80 text-xs font-mono">
                            {error.message}
                        </span>
                    )}
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        再試行
                    </button>
                    <a href="/create" className="btn btn-secondary">
                        ワークスペースへ
                    </a>
                </div>
            </div>
        </div>
    );
}
