import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface InventoryChartProps {
  data: Array<{
    name: string;
    quantity: number;
  }>;
}

export default function InventoryChart({ data }: InventoryChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect p-3 rounded-lg border border-border">
          <p className="text-foreground font-medium">{label}</p>
          <p className="text-primary">
            Quantity: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center"
      >
        <div className="w-2 h-6 bg-gradient-to-b from-primary to-accent rounded-full mr-3" />
        Inventory Levels
      </motion.h3>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="h-48 sm:h-64 lg:h-80 xl:h-96"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke="rgb(var(--foreground-muted))"
              fontSize={10}
              tick={{ fill: 'rgb(var(--foreground-muted))' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="rgb(var(--foreground-muted))"
              fontSize={10}
              tick={{ fill: 'rgb(var(--foreground-muted))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="quantity"
              fill="url(#colorGradient)"
              radius={[4, 4, 0, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}