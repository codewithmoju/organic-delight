import { AlertTriangle } from 'lucide-react';

interface LowStockAlertProps {
  items: Array<{
    name: string;
    quantity: number;
    reorder_point: number;
  }>;
}

export default function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Low Stock Alert
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <ul className="list-disc space-y-1 pl-5">
              {items.map((item) => (
                <li key={item.name}>
                  {item.name} - Only {item.quantity} units remaining
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}