

export default function PerformanceSkeleton() {
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-secondary/50 rounded-lg" />
                    <div className="h-4 w-64 bg-secondary/50 rounded" />
                </div>
                <div className="h-10 w-40 bg-secondary/50 rounded-xl" />
            </div>

            {/* ─── CHARTS ROW ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-[400px] bg-card rounded-2xl border border-border/60 p-6">
                    <div className="h-6 w-48 bg-secondary/50 rounded mb-6" />
                    <div className="h-full bg-secondary/30 rounded-xl" />
                </div>
                <div className="h-[400px] bg-card rounded-2xl border border-border/60 p-6">
                    <div className="h-6 w-48 bg-secondary/50 rounded mb-6" />
                    <div className="flex items-center justify-center h-full">
                        <div className="w-48 h-48 rounded-full bg-secondary/30" />
                    </div>
                </div>
            </div>

            {/* ─── BOTTOM ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[300px] bg-card rounded-2xl border border-border/60 p-6">
                    <div className="h-6 w-32 bg-secondary/50 rounded mb-6" />
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-4 w-1/4 bg-secondary/50 rounded" />
                                <div className="h-4 w-1/4 bg-secondary/50 rounded" />
                                <div className="h-4 w-1/4 bg-secondary/50 rounded" />
                                <div className="h-4 w-1/4 bg-secondary/50 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-[300px] bg-card rounded-2xl border border-border/60 p-6">
                    <div className="h-6 w-32 bg-secondary/50 rounded mb-6" />
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-secondary/30 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
