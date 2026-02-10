export default function LedgerSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/50" />
                    <div>
                        <div className="h-8 w-48 bg-secondary/50 rounded-lg mb-2" />
                        <div className="h-4 w-32 bg-secondary/30 rounded" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-24 bg-secondary/50 rounded-xl" />
                    <div className="h-10 w-32 bg-secondary/50 rounded-xl" />
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="card-theme p-6 rounded-[2.5rem] border border-border/50 h-32 flex flex-col justify-between">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-secondary/50 rounded" />
                            <div className="w-6 h-6 rounded-full bg-secondary/30" />
                        </div>
                        <div className="h-8 w-32 bg-secondary/50 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Table Card Skeleton */}
            <div className="card-theme p-8 rounded-[2.5rem] border border-border/50 min-h-[400px]">
                <div className="h-6 w-48 bg-secondary/50 rounded mb-8" />

                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-border/30">
                            <div className="h-4 w-24 bg-secondary/50 rounded" />
                            <div className="h-6 w-16 bg-secondary/30 rounded-full" />
                            <div className="h-4 w-32 bg-secondary/30 rounded" />
                            <div className="h-4 w-48 bg-secondary/30 rounded" />
                            <div className="h-4 w-20 bg-secondary/50 rounded" />
                            <div className="h-4 w-20 bg-secondary/50 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
