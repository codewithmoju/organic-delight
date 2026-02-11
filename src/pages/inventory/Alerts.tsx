import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLowStockItems } from '../../lib/api/lowStock';
import { Item } from '../../lib/types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Alerts() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLowStock = async () => {
        setIsLoading(true);
        try {
            const data = await getLowStockItems();
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch low stock items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLowStock();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {t('alerts.title', 'Notifications & Alerts')}
                    </h1>
                    <p className="text-foreground-muted mt-1">
                        {t('alerts.subtitle', 'Items requiring your attention')}
                    </p>
                </div>
                <button
                    onClick={fetchLowStock}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {t('common.refresh', 'Refresh')}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" text={t('alerts.loading', 'Loading alerts...')} />
                </div>
            ) : items.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-card rounded-xl border border-border shadow-sm"
                >
                    <div className="w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-success-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t('alerts.allGood', 'All caught up!')}
                    </h3>
                    <p className="text-foreground-muted max-w-md mx-auto">
                        {t('alerts.noLowStock', 'Your inventory is healthy. No items are currently below their details.min stock level.')}
                    </p>
                </motion.div>
            ) : (
                <div className="grid gap-4">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-warning-500/10 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-warning-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground group-hover:text-primary-500 transition-colors">
                                        {item.name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-foreground-muted">
                                        <span className="flex items-center gap-1">
                                            {t('common.sku', 'SKU')}: <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">{item.sku}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {t('items.category', 'Category')}: {item.category?.name || 'Uncategorized'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 sm:pl-4 sm:border-l border-border/50">
                                <div className="flex flex-col items-end min-w-[100px]">
                                    <span className="text-xs text-foreground-muted uppercase tracking-wider font-medium">
                                        {t('items.stock', 'Current Stock')}
                                    </span>
                                    <span className="text-xl font-bold text-error-500">
                                        {item.current_quantity} {item.unit}
                                    </span>
                                    <span className="text-xs text-warning-600 font-medium">
                                        Min: {item.low_stock_threshold || 0}
                                    </span>
                                </div>

                                <button
                                    onClick={() => navigate(`/transactions?tab=purchases&item=${item.id}`)}
                                    className="p-2 rounded-lg hover:bg-primary-500/10 text-primary-500 transition-colors"
                                    title={t('inventory.restock', 'Restock Item')}
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
