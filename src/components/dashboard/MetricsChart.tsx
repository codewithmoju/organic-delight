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
}

export default function MetricsChart({ data, type, title }: MetricsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect p-4 rounded-lg border border-dark-600/50 min-w-[200px]">
          <p className="text-gray-200 font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm ${
              entry.dataKey.includes('revenue') ? 'text-success-400' : 'text-primary-400'
            }`}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="card-dark p-4 sm:p-6"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity'
      }}
    >
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.15 }}
        className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center"
      >
        <div className="w-2 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full mr-3" />
        {title}
      </motion.h3>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.15 }}
        className="h-64 sm:h-80 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="period" 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="period" 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
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