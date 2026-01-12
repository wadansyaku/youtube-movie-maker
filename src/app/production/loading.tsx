'use client';

export default function ProductionLoading() {
    return (
        <div className="p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="h-7 w-36 bg-gray-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-56 bg-gray-800/50 rounded animate-pulse" />
                </div>
                <div className="h-9 w-28 bg-gray-800 rounded-lg animate-pulse" />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                    <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-gray-800">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="px-4 py-4">
                            <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse mb-2" />
                            <div className="h-3 w-1/3 bg-gray-800/60 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
