export default function CategorySkeleton() {
    return (
        <div className="card-theme p-6 rounded-[2.5rem] relative overflow-hidden h-full border border-border/50">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary/50 animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-secondary/50 animate-pulse" />
            </div>

            {/* Title & Badge Skeleton */}
            <div className="space-y-3 mb-6">
                <div className="h-7 w-3/4 bg-secondary/50 rounded-lg animate-pulse" />
                <div className="h-5 w-1/3 bg-secondary/30 rounded-md animate-pulse" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-secondary/30 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-secondary/30 rounded animate-pulse" />
            </div>

            {/* Footer / Stats Skeleton */}
            <div className="mt-auto pt-4 border-t border-border/30 flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-secondary/50 animate-pulse" />
                <div className="h-5 w-20 bg-secondary/50 rounded animate-pulse" />
            </div>

            {/* Decorative Blob Skeleton */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        </div>
    );
}
