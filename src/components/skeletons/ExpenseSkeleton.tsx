export default function ExpenseSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6 animate-pulse pb-10">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1.5">
                    <div className="h-7 w-40 bg-secondary/50 rounded-lg" />
                    <div className="h-4 w-56 bg-secondary/50 rounded" />
                </div>
                <div className="h-10 w-36 bg-secondary/50 rounded-xl" />
            </div>

            {/* ─── STATS — 3 cols on sm+ ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-card border border-border/60 p-4 sm:p-5 h-[76px] sm:h-[88px]">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-secondary/50 flex-shrink-0" />
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="h-2.5 w-20 bg-secondary/50 rounded" />
                                <div className="h-5 w-28 bg-secondary/50 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── CONTENT GRID ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* List */}
                <div className="lg:col-span-3 space-y-3">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="h-11 flex-1 bg-card rounded-xl border border-border/60" />
                        <div className="h-11 w-full sm:w-52 bg-card rounded-xl border border-border/60" />
                    </div>

                    {/* Table card */}
                    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                        {/* Mobile rows */}
                        <div className="sm:hidden divide-y divide-border/30">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-9 h-9 rounded-xl bg-secondary/50 flex-shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3.5 w-32 bg-secondary/50 rounded" />
                                        <div className="h-3 w-24 bg-secondary/40 rounded" />
                                    </div>
                                    <div className="h-4 w-16 bg-secondary/50 rounded flex-shrink-0" />
                                </div>
                            ))}
                        </div>

                        {/* Desktop table header + rows */}
                        <div className="hidden sm:block">
                            <div className="px-5 py-3.5 border-b border-border/40 grid grid-cols-5 gap-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-3 bg-secondary/50 rounded" />
                                ))}
                            </div>
                            <div className="divide-y divide-border/30">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="px-5 py-3.5 grid grid-cols-5 gap-4 items-center">
                                        <div className="h-4 bg-secondary/50 rounded col-span-1" />
                                        <div className="h-6 bg-secondary/40 rounded-lg w-24" />
                                        <div className="h-4 bg-secondary/40 rounded w-20" />
                                        <div className="h-4 bg-secondary/40 rounded w-16" />
                                        <div className="h-4 bg-secondary/50 rounded w-16 place-self-end" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Breakdown panel */}
                <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 h-fit">
                    <div className="h-5 w-28 bg-secondary/50 rounded mb-4" />
                    <div className="space-y-3.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between">
                                    <div className="h-3 w-20 bg-secondary/50 rounded" />
                                    <div className="h-3 w-14 bg-secondary/50 rounded" />
                                </div>
                                <div className="h-1.5 w-full bg-secondary/30 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
