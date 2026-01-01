'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Remotion Player
const QuickPreview = dynamic(() => import('@/components/studio/QuickPreview'), {
    ssr: false,
    loading: () => (
        <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 animate-pulse">
            <div className="h-8 w-48 bg-gray-800 rounded mb-4" />
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-32 bg-gray-900 rounded" />
                <div className="h-[300px] bg-gray-900 rounded" />
            </div>
        </div>
    ),
});

export default function QuickPreviewWrapper() {
    return <QuickPreview />;
}
