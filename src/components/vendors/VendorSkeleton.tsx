export default function VendorSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Vendor cards — 1 col mobile, 2 col sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50 flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl -mr-8 -mt-8" />

                        {/* Top row: icon + balance */}
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl bg-secondary/50" />
                            <div className="text-right space-y-1">
                                <div className="h-5 w-20 bg-secondary/50 rounded-lg" />
                                <div className="h-3 w-12 bg-secondary/30 rounded ml-auto" />
                            </div>
                        </div>

                        {/* Name + contact */}
                        <div className="space-y-1.5">
                            <div className="h-4 w-3/4 bg-secondary/50 rounded" />
                            <div className="h-3 w-1/2 bg-secondary/30 rounded" />
                            <div className="h-3 w-2/5 bg-secondary/30 rounded" />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <div className="h-3 w-16 bg-secondary/30 rounded" />
                            <div className="flex gap-1.5">
                                <div className="w-8 h-8 rounded-xl bg-secondary/40" />
                                <div className="w-20 h-8 rounded-xl bg-secondary/40" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
