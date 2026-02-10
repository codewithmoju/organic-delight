import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

interface MetricsChartProps {
  data: Array<{
    period: string;
    stockIn: number;
    stockOut: number;
    revenueIn: number;
    revenueOut: number;
  }>;
  type: 'bar' | 'line';
  title: string;
  isLoading?: boolean;
}

export default function MetricsChart({ data, type, title, isLoading = false }: MetricsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect p-4 rounded-[2.5rem] border border-border min-w-[200px]">
          <p className="text-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm ${entry.dataKey.includes('revenue') ? 'text-success-400' : 'text-primary'
              }`}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="card-theme p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="h-6 bg-secondary rounded mb-6 w-1/3 animate-pulse" />
          <div className="h-64 sm:h-80 bg-secondary rounded animate-pulse" />
        </motion.div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card-theme p-4 sm:p-6 flex flex-col items-center justify-center h-[350px] text-center">
        <div className="p-3 bg-secondary rounded-full mb-4">
          <ResponsiveContainer width={40} height={40}>
            <BarChart data={[{ v: 1 }, { v: 2 }, { v: 1 }]}>
              <Bar dataKey="v" fill="#cbd5e1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No Data Available</h3>
        <p className="text-muted-foreground text-sm">sales analytics will appear here once you have transactions.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="card-theme p-4 sm:p-6"
    >
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center"
      >
        <div className="w-2 h-6 bg-gradient-to-b from-primary to-accent rounded-full mr-3" />
        {title}
      </motion.h3>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="h-64 sm:h-80 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="period"
                stroke="rgb(var(--foreground-muted))"
                fontSize={10}
                tick={{ fill: 'rgb(var(--foreground-muted))' }}
              />
              <YAxis
                stroke="rgb(var(--foreground-muted))"
                fontSize={10}
                tick={{ fill: 'rgb(var(--foreground-muted))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="stockIn"
                name="Stock In"
                fill="#22c55e"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="stockOut"
                name="Stock Out"
                fill="#ef4444"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>

              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="period"
                stroke="rgb(var(--foreground-muted))"
                fontSize={10}
                tick={{ fill: 'rgb(var(--foreground-muted))' }}
              />
              <YAxis
                stroke="rgb(var(--foreground-muted))"
                fontSize={10}
                tick={{ fill: 'rgb(var(--foreground-muted))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenueIn"
                name="Revenue In"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="revenueOut"
                name="Revenue Out"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}