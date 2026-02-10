
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

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
            <div className="card-theme p-6 h-full animate-pulse">
                <div className="h-48 bg-secondary rounded-lg mb-4"></div>
                <div className="h-6 w-3/4 bg-secondary rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-secondary rounded"></div>
            </div>
        );
    }

    // Fallback if no product
    const data = product || {
        name: "Sportswear Phoenix Fleece",
        soldToday: 32,
        price: 86,
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-theme h-full overflow-hidden relative group p-6 rounded-[2.5rem] flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-foreground">Highest Selling</h3>
                    <div className="inline-flex items-center gap-1 bg-success-500/10 px-3 py-1 rounded-full text-xs font-medium">
                        <TrendingUp className="w-3 h-3 text-success-500" />
                        <span className="text-success-600">{data.soldToday}% Higher</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Top Product</p>
                    <h4 className="font-bold text-2xl leading-tight text-foreground line-clamp-2">{data.name}</h4>
                </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
                <div>
                    <p className="font-bold text-3xl text-primary">${data.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">Unit Price</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
}
