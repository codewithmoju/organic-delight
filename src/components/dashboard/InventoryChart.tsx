import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface InventoryChartProps {
  data: Array<{ name: string; quantity: number }>;
}

export default function InventoryChart({ data }: InventoryChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border/60 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-primary-500 font-bold">Qty: {payload[0].value}</p>
      </div>
    );
  };

  const axisProps = {
    stroke: 'rgb(var(--foreground-muted))',
    fontSize: 10,
    tick: { fill: 'rgb(var(--foreground-muted))' },
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2"
      >
        <div className="w-1.5 h-5 bg-gradient-to-b from-primary to-accent rounded-full" />
        Inventory Levels
      </motion.h3>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="h-44 sm:h-60 lg:h-72"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: data.length > 6 ? 40 : 0 }}
          >
            <defs>
              <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgb(var(--primary))"  stopOpacity={0.9} />
                <stop offset="100%" stopColor="rgb(var(--primary))"  stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="name"
              {...axisProps}
              interval={0}
              angle={data.length > 6 ? -40 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 50 : 20}
            />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--muted) / 0.3)' }} />
            <Bar dataKey="quantity" fill="url(#invGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
