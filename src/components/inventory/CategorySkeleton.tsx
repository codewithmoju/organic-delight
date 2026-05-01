export default function CategorySkeleton() {
  return (
    <div className="card-theme rounded-2xl sm:rounded-[2rem] relative overflow-hidden flex flex-col border border-border/50 animate-pulse">
      {/* Info area */}
      <div className="p-3 sm:p-4 flex-1">
        {/* Icon + count row */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/50" />
          <div className="w-10 h-5 rounded-lg bg-secondary/40" />
        </div>

        {/* Title */}
        <div className="h-4 w-3/4 bg-secondary/50 rounded-lg mb-2" />

        {/* Description lines */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-secondary/30 rounded" />
          <div className="h-3 w-2/3 bg-secondary/30 rounded" />
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-end gap-1.5 px-3 pb-3">
        <div className="w-8 h-8 rounded-xl bg-secondary/40" />
        <div className="w-8 h-8 rounded-xl bg-secondary/40" />
      </div>

      {/* Decorative blob */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
    </div>
  );
}
