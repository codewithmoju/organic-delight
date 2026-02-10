

export default function ExpenseSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-secondary/50 rounded-lg" />
                    <div className="h-4 w-64 bg-secondary/50 rounded" />
                </div>
                <div className="h-10 w-40 bg-secondary/50 rounded-xl" />
            </div>

            {/* ─── STATS CARDS ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-card border border-border/60 p-6 h-[120px]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-4 w-24 bg-secondary/50 rounded" />
                            <div className="h-8 w-8 rounded-lg bg-secondary/50" />
                        </div>
                        <div className="h-8 w-32 bg-secondary/50 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* ─── EXPENSE LIST & BREAKDOWN ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* List */}
                <div className="lg:col-span-3">
                    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border/40 grid grid-cols-6 gap-4">
                            <div className="h-4 bg-secondary/50 rounded col-span-2" />
                            <div className="h-4 bg-secondary/50 rounded" />
                            <div className="h-4 bg-secondary/50 rounded" />
                            <div className="h-4 bg-secondary/50 rounded" />
                            <div className="h-4 bg-secondary/50 rounded" />
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border/30">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 grid grid-cols-6 gap-4 items-center">
                                    <div className="h-5 bg-secondary/50 rounded col-span-2" />
                                    <div className="h-4 bg-secondary/50 rounded w-20" />
                                    <div className="h-4 bg-secondary/50 rounded w-16" />
                                    <div className="h-4 bg-secondary/50 rounded w-12" />
                                    <div className="h-5 bg-secondary/50 rounded w-16 place-self-end" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Breakdown Panel */}
                <div className="space-y-6">
                    <div className="bg-card rounded-2xl border border-border/60 p-6 h-[300px]">
                        <div className="h-6 w-32 bg-secondary/50 rounded mb-6" />
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between">
                                        <div className="h-3 w-16 bg-secondary/50 rounded" />
                                        <div className="h-3 w-12 bg-secondary/50 rounded" />
                                    </div>
                                    <div className="h-2 w-full bg-secondary/30 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
