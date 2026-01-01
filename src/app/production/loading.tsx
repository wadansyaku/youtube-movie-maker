'use client';

export default function ProductionLoading() {
    return (
        <div className="p-8 animate-fade-in">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-gray-800/50 rounded animate-pulse" />
                </div>
                <div className="h-10 w-36 bg-gray-800 rounded-lg animate-pulse" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-800/30 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse" />
                            <div>
                                <div className="h-6 w-12 bg-gray-700 rounded animate-pulse mb-1" />
                                <div className="h-3 w-16 bg-gray-700/50 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Kanban Skeleton */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-72 bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                            <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            {[...Array(2)].map((_, j) => (
                                <div key={j} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                    <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-2" />
                                    <div className="h-3 w-24 bg-gray-700/50 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
