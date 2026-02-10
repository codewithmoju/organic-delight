import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  className?: string;
  rows?: number;
  variant?: 'lines' | 'card' | 'table' | 'profile';
  animated?: boolean;
}

export default function SkeletonLoader({
  className = '',
  rows = 1,
  variant = 'lines',
  animated = true
}: SkeletonLoaderProps) {

  // Mobile-optimized shimmer animation
  const shimmerAnimation = animated ? {
    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '200% 100%',
    animation: 'mobile-shimmer 1.5s infinite',
  } : {};

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`card-theme p-6 rounded-[2.5rem] border border-border/50 ${className}`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-secondary/50 rounded-full" style={shimmerAnimation} />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary/50 rounded w-3/4" style={shimmerAnimation} />
              <div className="h-3 bg-secondary/50 rounded w-1/2" style={shimmerAnimation} />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-20 bg-secondary/30 rounded-2xl" style={shimmerAnimation} />
            <div className="flex justify-between">
              <div className="h-8 w-20 bg-secondary/50 rounded-lg" style={shimmerAnimation} />
              <div className="h-8 w-20 bg-secondary/50 rounded-lg" style={shimmerAnimation} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'table') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`animate-pulse ${className}`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="card-theme rounded-[2.5rem] overflow-hidden border border-border/50">
          <div className="px-6 py-5 border-b border-border/50 bg-secondary/30">
            <div className="flex justify-between">
              <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerAnimation} />
              <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerAnimation} />
              <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerAnimation} />
              <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerAnimation} />
            </div>
          </div>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="px-6 py-5 border-b border-border/30 last:border-b-0">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-secondary/50 rounded w-1/4" style={shimmerAnimation} />
                <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerAnimation} />
                <div className="h-4 bg-secondary/50 rounded w-1/12" style={shimmerAnimation} />
                <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerAnimation} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === 'profile') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`animate-pulse ${className}`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-secondary/50 rounded-full" style={shimmerAnimation} />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-secondary/50 rounded w-1/2" style={shimmerAnimation} />
            <div className="h-4 bg-secondary/50 rounded w-3/4" style={shimmerAnimation} />
            <div className="h-3 bg-secondary/50 rounded w-1/3" style={shimmerAnimation} />
          </div>
        </div>
      </motion.div>
    );
  }

  // Default lines variant
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`animate-pulse ${className}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-secondary/50 rounded mb-2 last:mb-0"
          style={shimmerAnimation}
        />
      ))}
    </motion.div>
  );
}

// Optimized Table Skeleton with mobile performance
export function TableSkeleton({ rows = 5, animated = true }: { rows?: number; animated?: boolean }) {
  const shimmerStyle = animated ? {
    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '200% 100%',
    animation: 'mobile-shimmer 1.5s infinite',
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="animate-pulse"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
      }}
    >
      <div className="card-theme rounded-[2.5rem] overflow-hidden border border-border/50">
        <div className="px-6 py-5 border-b border-border/50 bg-secondary/30">
          <div className="flex justify-between gap-4">
            <div className="h-4 bg-secondary/50 rounded w-1/4" style={shimmerStyle} />
            <div className="h-4 bg-secondary/50 rounded w-1/4" style={shimmerStyle} />
            <div className="h-4 bg-secondary/50 rounded w-1/4" style={shimmerStyle} />
            <div className="h-4 bg-secondary/50 rounded w-1/4" style={shimmerStyle} />
          </div>
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-6 py-5 border-b border-border/30 last:border-b-0">
            <div className="flex justify-between gap-4">
              <div className="h-4 bg-secondary/50 rounded w-1/4" style={shimmerStyle} />
              <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerStyle} />
              <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerStyle} />
              <div className="h-4 bg-secondary/50 rounded w-1/6" style={shimmerStyle} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Page-level skeleton for full page loading
export function PageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonLoader key={index} variant="card" />
      ))}
    </motion.div>
  );
}