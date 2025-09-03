interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white p-4 sm:p-6 shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
            {icon}
          </div>
        </div>
        <div className="ml-3 sm:ml-5 w-0 flex-1">
          <dl>
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-lg sm:text-2xl font-semibold text-gray-900">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-xs sm:text-sm font-semibold ${
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                  <span className="ml-1 text-gray-500 hidden sm:inline">{trend.label}</span>
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}