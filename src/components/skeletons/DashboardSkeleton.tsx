
export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-8 animate-pulse p-1">

            {/* ─── MAIN LAYOUT ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                {/* Left Column (66%) */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Featured Card */}
                        <div className="bg-card rounded-[2rem] border border-border/60 p-6 h-[200px] flex flex-col justify-between">
                            <div className="h-6 w-32 bg-secondary/50 rounded-lg" />
                            <div className="h-12 w-48 bg-secondary/50 rounded-xl" />
                        </div>

                        {/* Secondary Metrics Stack */}
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <div className="bg-card rounded-[2rem] border border-border/60 p-6 h-[90px] flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-secondary/50 rounded" />
                                    <div className="h-6 w-16 bg-secondary/50 rounded" />
                                </div>
                                <div className="h-10 w-10 bg-secondary/30 rounded-full" />
                            </div>
                            <div className="bg-card rounded-[2rem] border border-border/60 p-6 h-[90px] flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-secondary/50 rounded" />
                                    <div className="h-6 w-16 bg-secondary/50 rounded" />
                                </div>
                                <div className="h-10 w-10 bg-secondary/30 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Additional Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-card rounded-[2rem] border border-border/60 p-6 h-[140px] flex flex-col justify-between">
                            <div className="h-10 w-10 bg-secondary/30 rounded-xl mb-2" />
                            <div>
                                <div className="h-4 w-24 bg-secondary/50 rounded mb-1" />
                                <div className="h-8 w-32 bg-secondary/50 rounded" />
                            </div>
                        </div>
                        <div className="bg-card rounded-[2rem] border border-border/60 p-6 h-[140px] flex flex-col justify-between">
                            <div className="h-10 w-10 bg-secondary/30 rounded-xl mb-2" />
                            <div>
                                <div className="h-4 w-24 bg-secondary/50 rounded mb-1" />
                                <div className="h-8 w-32 bg-secondary/50 rounded" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <div className="bg-card rounded-[2rem] border border-border/60 p-6 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-6 w-40 bg-secondary/50 rounded-lg" />
                            <div className="h-8 w-24 bg-secondary/30 rounded-lg" />
                        </div>
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border-b border-border/30">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-secondary/30" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-secondary/50 rounded" />
                                            <div className="h-3 w-20 bg-secondary/50 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-5 w-24 bg-secondary/50 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (33%) */}
                <div className="lg:col-span-1 space-y-6 sm:space-y-8">
                    {/* Analytics Chart */}
                    <div className="bg-card rounded-[2rem] border border-border/60 p-6 h-[350px]">
                        <div className="h-6 w-32 bg-secondary/50 rounded mb-6" />
                        <div className="h-64 bg-secondary/20 rounded-xl w-full flex items-end justify-around px-4 pb-4 gap-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="w-full bg-secondary/40 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                            ))}
                        </div>
                    </div>

                    {/* Top Product */}
                    <div className="bg-card rounded-[2rem] border border-border/60 p-6 h-[250px]">
                        <div className="h-6 w-40 bg-secondary/50 rounded mb-6" />
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-secondary/30 mb-4" />
                            <div className="h-5 w-32 bg-secondary/50 rounded mb-2" />
                            <div className="h-4 w-20 bg-secondary/50 rounded" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
