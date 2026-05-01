export default function LedgerSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/50" />
                    <div className="space-y-1.5">
                        <div className="h-6 w-40 bg-secondary/50 rounded-lg" />
                        <div className="h-3.5 w-28 bg-secondary/30 rounded" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-20 bg-secondary/40 rounded-xl" />
                    <div className="h-9 w-20 bg-secondary/40 rounded-xl" />
                    <div className="h-9 w-32 bg-secondary/50 rounded-xl" />
                </div>
            </div>

            {/* Stats — 1 col mobile, 3 col sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50 h-28 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/10 rounded-full blur-xl -mr-6 -mt-6" />
                        <div className="flex justify-between items-start">
                            <div className="h-3 w-24 bg-secondary/40 rounded" />
                            <div className="w-8 h-8 rounded-xl bg-secondary/30" />
                        </div>
                        <div className="h-7 w-32 bg-secondary/50 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Ledger card */}
            <div className="card-theme rounded-2xl sm:rounded-[2rem] border border-border/50 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-border/30 flex justify-between items-center">
                    <div className="space-y-1.5">
                        <div className="h-5 w-40 bg-secondary/50 rounded" />
                        <div className="h-3 w-28 bg-secondary/30 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-secondary/30 rounded-lg" />
                </div>
                <div className="p-4 sm:p-6 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-secondary/40 flex-shrink-0" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3.5 w-32 bg-secondary/50 rounded" />
                                    <div className="h-3 w-20 bg-secondary/30 rounded" />
                                </div>
                            </div>
                            <div className="text-right space-y-1.5 flex-shrink-0">
                                <div className="h-4 w-20 bg-secondary/50 rounded ml-auto" />
                                <div className="h-3 w-14 bg-secondary/30 rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
