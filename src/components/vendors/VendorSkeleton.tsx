export default function VendorSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Search Bar Skeleton */}
            <div className="h-12 w-full max-w-md bg-secondary/50 rounded-2xl" />

            {/* Vendors Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-theme p-6 rounded-[2.5rem] border border-border/50 h-56 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10" />

                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-secondary/50" />
                            <div className="flex flex-col items-end gap-2">
                                <div className="h-6 w-24 bg-secondary/50 rounded-lg" />
                                <div className="h-3 w-16 bg-secondary/30 rounded" />
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <div className="h-5 w-3/4 bg-secondary/50 rounded" />
                            <div className="h-4 w-1/2 bg-secondary/30 rounded" />
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                            <div className="h-4 w-20 bg-secondary/30 rounded" />
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-lg bg-secondary/50" />
                                <div className="w-24 h-8 rounded-lg bg-secondary/50" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
