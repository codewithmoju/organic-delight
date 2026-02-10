import { motion } from 'framer-motion';

export default function ValuationSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-secondary/50 rounded-lg mb-2" />
                    <div className="h-4 w-64 bg-secondary/30 rounded" />
                </div>
                <div className="h-10 w-32 bg-secondary/50 rounded-xl" />
            </div>

            {/* Metrics Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="card-theme p-6 rounded-[2.5rem] border border-border/50 h-40 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10" />

                        <div className="h-4 w-1/3 bg-secondary/50 rounded" />
                        <div className="h-10 w-2/3 bg-primary/20 rounded-lg my-2" />
                        <div className="h-3 w-1/2 bg-secondary/30 rounded" />
                    </div>
                ))}
            </div>

            {/* Table Card Skeleton */}
            <div className="card-theme p-8 rounded-[2.5rem] border border-border/50 min-h-[400px]">
                <div className="flex justify-between mb-8">
                    <div className="h-6 w-32 bg-secondary/50 rounded" />
                    <div className="h-6 w-24 bg-secondary/30 rounded" />
                </div>

                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-border/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary/50" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-secondary/50 rounded" />
                                    <div className="h-3 w-20 bg-secondary/30 rounded" />
                                </div>
                            </div>
                            <div className="h-4 w-24 bg-secondary/30 rounded" />
                            <div className="h-4 w-24 bg-secondary/30 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
