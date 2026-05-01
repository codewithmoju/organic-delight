import { motion } from 'framer-motion';
import { TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/notifications';

interface TopProductProps {
  product?: {
    name: string;
    soldToday: number;
    price: number;
    image?: string;
  };
  isLoading?: boolean;
}

export default function TopProductCard({ product, isLoading }: TopProductProps) {
  if (isLoading) {
    return (
      <div className="card-theme p-4 sm:p-6 animate-pulse rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-secondary/60 rounded" />
          <div className="h-6 w-20 bg-secondary/40 rounded-full" />
        </div>
        <div className="h-4 w-20 bg-secondary/40 rounded mb-2" />
        <div className="h-7 w-40 bg-secondary/60 rounded mb-4" />
        <div className="flex items-end justify-between">
          <div className="h-8 w-24 bg-secondary/60 rounded" />
          <div className="h-10 w-10 bg-secondary/30 rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card-theme p-4 sm:p-6 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[160px] text-center">
        <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No product data</p>
        <p className="text-xs text-muted-foreground mt-1">Add inventory to see top products</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-theme p-4 sm:p-6 rounded-[2.5rem] relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm sm:text-base text-foreground">Highest Value</h3>
        <div className="inline-flex items-center gap-1 bg-success-500/10 px-2.5 py-1 rounded-full">
          <TrendingUp className="w-3 h-3 text-success-500" />
          <span className="text-xs font-semibold text-success-600 dark:text-success-400">
            {product.soldToday} units
          </span>
        </div>
      </div>

      {/* Product info */}
      <p className="text-xs text-muted-foreground mb-1">Top Product</p>
      <h4 className="font-bold text-lg sm:text-xl text-foreground leading-tight line-clamp-2 mb-4">
        {product.name}
      </h4>

      {/* Price row */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-bold text-2xl sm:text-3xl text-primary">{formatCurrency(product.price)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Unit Price</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
    </motion.div>
  );
}
