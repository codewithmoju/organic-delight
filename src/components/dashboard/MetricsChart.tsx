import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

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

// Use CSS variables so colours respect light/dark theme
const COLOR_IN  = 'rgb(var(--success))';   // green
const COLOR_OUT = 'rgb(var(--error))';     // red
const COLOR_REV = 'rgb(var(--primary))';   // orange

export default function MetricsChart({ data, type, title, isLoading = false }: MetricsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border/60 rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
        <p className="font-semibold text-foreground mb-1.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="text-xs">
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="card-theme p-4 sm:p-6 space-y-4">
        <div className="h-5 bg-secondary/60 rounded w-1/3 animate-pulse" />
        <div className="h-56 sm:h-72 bg-secondary/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card-theme p-4 sm:p-6 flex flex-col items-center justify-center min-h-[280px] text-center">
        <div className="flex gap-1 mb-4">
          {[40, 65, 30, 80, 50].map((h, i) => (
            <div key={i} className="w-4 rounded-t bg-secondary/50" style={{ height: h }} />
          ))}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No Data Yet</h3>
        <p className="text-sm text-muted-foreground">Sales analytics will appear once you have transactions.</p>
      </div>
    );
  }

  const axisProps = {
    stroke: 'rgb(var(--foreground-muted))',
    fontSize: 10,
    tick: { fill: 'rgb(var(--foreground-muted))' },
  };

  const chartMargin = { top: 10, right: 10, left: -10, bottom: 0 };

  return (
    <div className="card-theme p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <div className="w-1.5 h-5 bg-gradient-to-b from-primary to-accent rounded-full" />
        {title}
      </h3>

      <div className="h-52 sm:h-64 lg:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={chartMargin} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--muted) / 0.3)' }} />
              <Bar dataKey="stockIn"  name="Stock In"  fill={COLOR_IN}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="stockOut" name="Stock Out" fill={COLOR_OUT} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenueIn"  name="Revenue In"  stroke={COLOR_IN}  strokeWidth={2} dot={{ r: 3, fill: COLOR_IN }}  activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="revenueOut" name="Revenue Out" stroke={COLOR_REV} strokeWidth={2} dot={{ r: 3, fill: COLOR_REV }} activeDot={{ r: 5 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
