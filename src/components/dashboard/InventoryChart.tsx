import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InventoryChartProps {
  data: Array<{
    name: string;
    quantity: number;
  }>;
}

export default function InventoryChart({ data }: InventoryChartProps) {
  return (
    <div className="h-[400px] bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
        Inventory Levels
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="quantity" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}