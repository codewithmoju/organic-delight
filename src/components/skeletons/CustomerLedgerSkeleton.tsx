export default function CustomerLedgerSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* ─── BACK BUTTON ─── */}
            <div className="h-4 w-32 bg-secondary/50 rounded" />

            {/* ─── CUSTOMER PROFILE HEADER ─── */}
            <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex-shrink-0" />

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                        <div className="h-8 w-48 bg-secondary/50 rounded-lg" />
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                            <div className="h-4 w-24 bg-secondary/50 rounded" />
                            <div className="h-4 w-32 bg-secondary/50 rounded" />
                            <div className="h-4 w-24 bg-secondary/50 rounded" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary/50" />
                        <div className="h-10 w-40 rounded-xl bg-secondary/50" />
                    </div>
                </div>
            </div>

            {/* ─── STATS ─── */}
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

            {/* ─── TABS ─── */}
            <div className="bg-card rounded-2xl border border-border/60 p-1.5 shadow-sm h-12" />

            {/* ─── LEDGER ENTRIES ─── */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border/40">
                    <div className="h-4 w-20 bg-secondary/50 rounded" />
                </div>

                <div className="divide-y divide-border/30">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-secondary/50" />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-32 bg-secondary/50 rounded" />
                                    <div className="h-4 w-16 bg-secondary/50 rounded" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-24 bg-secondary/50 rounded" />
                                    <div className="h-3 w-20 bg-secondary/50 rounded" />
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="h-6 w-20 bg-secondary/50 rounded ml-auto" />
                                <div className="h-3 w-24 bg-secondary/50 rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
