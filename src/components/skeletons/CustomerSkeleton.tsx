export default function CustomerSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/50" />
                    <div className="space-y-2">
                        <div className="h-8 w-40 bg-secondary/50 rounded-lg" />
                        <div className="h-4 w-60 bg-secondary/50 rounded" />
                    </div>
                </div>
                <div className="h-10 w-36 bg-secondary/50 rounded-xl" />
            </div>

            {/* ─── STATS CARDS ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-card border border-border/60 p-5 h-[100px]">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-secondary/50" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-20 bg-secondary/50 rounded" />
                                <div className="h-6 w-24 bg-secondary/50 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── SEARCH & FILTERS ─── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-12 flex-1 bg-card rounded-xl border border-border/60" />
                <div className="h-12 w-48 bg-card rounded-xl border border-border/60" />
            </div>

            {/* ─── CONTENT LIST ─── */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-border/40 flex justify-between">
                    <div className="h-4 w-24 bg-secondary/50 rounded" />
                </div>

                {/* Rows */}
                <div className="divide-y divide-border/30">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/50" />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-32 bg-secondary/50 rounded" />
                                    <div className="h-4 w-12 bg-secondary/50 rounded" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-24 bg-secondary/50 rounded" />
                                    <div className="h-3 w-32 bg-secondary/50 rounded" />
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="h-5 w-20 bg-secondary/50 rounded ml-auto" />
                                <div className="h-3 w-16 bg-secondary/50 rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
