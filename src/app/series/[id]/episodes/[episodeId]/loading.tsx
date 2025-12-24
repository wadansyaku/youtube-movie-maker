import { Skeleton, SkeletonList, SkeletonText } from '@/components/ui/Skeleton';

export default function EpisodeLoading() {
    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
                {/* Left: Assets */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <SkeletonList count={4} />
                </div>

                {/* Right: Decision Log */}
                <div className="card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <SkeletonText lines={2} />
                    <Skeleton className="h-24 w-full" />
                    <SkeletonText lines={2} />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>

            {/* World Bible Reference */}
            <div className="glass rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <SkeletonText lines={3} />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <SkeletonText lines={3} />
                    </div>
                </div>
            </div>
        </div>
    );
}
