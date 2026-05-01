export default function ValuationSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="h-7 w-44 bg-secondary/50 rounded-lg mb-2" />
                    <div className="h-4 w-56 bg-secondary/30 rounded" />
                </div>
                <div className="h-10 w-32 bg-secondary/50 rounded-xl" />
            </div>

            {/* Metrics — 1 col mobile, 3 col sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50 h-32 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl -mr-8 -mt-8" />
                        <div className="h-9 w-9 bg-secondary/40 rounded-xl" />
                        <div>
                            <div className="h-3 w-24 bg-secondary/40 rounded mb-2" />
                            <div className="h-7 w-32 bg-primary/15 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="card-theme rounded-2xl sm:rounded-[2rem] border border-border/50 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border/30 flex justify-between items-center">
                    <div className="h-5 w-32 bg-secondary/50 rounded" />
                    <div className="h-6 w-20 bg-secondary/30 rounded-lg" />
                </div>
                <div className="p-4 sm:p-6 space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                            <div className="space-y-1.5 flex-1">
                                <div className="h-4 w-36 bg-secondary/50 rounded" />
                                <div className="h-3 w-20 bg-secondary/30 rounded" />
                            </div>
                            <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
                                <div className="h-6 w-10 bg-secondary/40 rounded-lg" />
                                <div className="h-4 w-20 bg-secondary/40 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
