import { Skeleton, SkeletonStat, SkeletonCard } from '@/components/ui/Skeleton';

export default function SeriesDetailLoading() {
    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-96" />

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24" />
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 gap-6">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
}
