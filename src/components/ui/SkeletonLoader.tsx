interface SkeletonLoaderProps {
  className?: string;
  rows?: number;
}

export default function SkeletonLoader({ className = '', rows = 1 }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-4 bg-gray-200 rounded mb-2 last:mb-0"></div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/8"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}