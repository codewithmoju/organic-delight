export default function PerformanceSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6 animate-pulse">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1.5">
                    <div className="h-7 w-44 bg-secondary/50 rounded-lg" />
                    <div className="h-4 w-60 bg-secondary/40 rounded" />
                </div>
                <div className="h-11 w-36 bg-secondary/50 rounded-xl" />
            </div>

            {/* ─── CHARTS ROW — 1 col mobile, 2 col lg+ ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-6 h-[300px] sm:h-[380px]">
                    <div className="h-5 w-44 bg-secondary/50 rounded mb-4" />
                    <div className="h-full bg-secondary/20 rounded-xl" />
                </div>
                <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-6 h-[300px] sm:h-[380px]">
                    <div className="h-5 w-44 bg-secondary/50 rounded mb-4" />
                    <div className="flex items-center justify-center h-full">
                        <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-secondary/20" />
                    </div>
                </div>
            </div>

            {/* ─── BOTTOM ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-4 sm:p-6">
                    <div className="h-5 w-36 bg-secondary/50 rounded mb-4" />
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex gap-3 items-center">
                                <div className="h-4 flex-1 bg-secondary/50 rounded" />
                                <div className="h-4 w-10 bg-secondary/40 rounded" />
                                <div className="h-4 w-20 bg-secondary/50 rounded" />
                                <div className="h-4 w-16 bg-secondary/30 rounded hidden sm:block" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-6">
                    <div className="h-5 w-32 bg-secondary/50 rounded mb-4" />
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-secondary/20 rounded-xl" />
                        ))}
                    </div>
                    <div className="mt-4 h-16 bg-secondary/15 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
