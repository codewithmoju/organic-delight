export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">

      {/* Period filter row */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-secondary/50 rounded-lg" />
        <div className="h-10 w-44 bg-secondary/40 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Top metrics — 2 cols on mobile */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Featured */}
            <div className="bg-card rounded-3xl border border-border/60 p-4 sm:p-6 h-[120px] sm:h-[140px] flex flex-col justify-between">
              <div className="h-9 w-9 bg-secondary/40 rounded-xl" />
              <div>
                <div className="h-3 w-20 bg-secondary/50 rounded mb-2" />
                <div className="h-7 w-28 bg-secondary/50 rounded" />
              </div>
            </div>
            {/* Stack */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="bg-card rounded-3xl border border-border/60 p-4 sm:p-5 h-[56px] sm:h-[64px] flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-secondary/50 rounded" />
                  <div className="h-5 w-12 bg-secondary/50 rounded" />
                </div>
                <div className="h-8 w-8 bg-secondary/30 rounded-full" />
              </div>
              <div className="bg-card rounded-3xl border border-border/60 p-4 sm:p-5 h-[56px] sm:h-[64px] flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-secondary/50 rounded" />
                  <div className="h-5 w-12 bg-secondary/50 rounded" />
                </div>
                <div className="h-8 w-8 bg-secondary/30 rounded-full" />
              </div>
            </div>
          </div>

          {/* Second metrics row — 2 cols on mobile */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[0, 1].map(i => (
              <div key={i} className="bg-card rounded-3xl border border-border/60 p-4 sm:p-6 h-[100px] sm:h-[120px] flex flex-col justify-between">
                <div className="h-9 w-9 bg-secondary/30 rounded-xl" />
                <div>
                  <div className="h-3 w-20 bg-secondary/50 rounded mb-2" />
                  <div className="h-6 w-24 bg-secondary/50 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div className="bg-card rounded-[2rem] border border-border/60 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 w-32 bg-secondary/50 rounded" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/30">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-28 bg-secondary/50 rounded" />
                    <div className="h-3 w-20 bg-secondary/40 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-secondary/50 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Chart */}
          <div className="bg-card rounded-[2rem] border border-border/60 p-4 sm:p-6 h-[280px] sm:h-[320px]">
            <div className="h-5 w-28 bg-secondary/50 rounded mb-4" />
            <div className="h-48 sm:h-56 bg-secondary/20 rounded-xl flex items-end justify-around px-3 pb-3 gap-1.5">
              {[55, 80, 40, 90, 60, 75, 45].map((h, i) => (
                <div key={i} className="flex-1 bg-secondary/40 rounded-t-lg" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* Top product */}
          <div className="bg-card rounded-[2rem] border border-border/60 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-28 bg-secondary/50 rounded" />
              <div className="h-6 w-16 bg-secondary/30 rounded-full" />
            </div>
            <div className="h-3 w-16 bg-secondary/40 rounded mb-2" />
            <div className="h-6 w-36 bg-secondary/50 rounded mb-4" />
            <div className="flex items-end justify-between">
              <div className="h-8 w-20 bg-secondary/50 rounded" />
              <div className="h-10 w-10 bg-secondary/30 rounded-full" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
