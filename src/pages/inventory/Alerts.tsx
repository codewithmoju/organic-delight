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
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="app-page-title">
                        {t('alerts.title', 'Notifications & Alerts')}
                    </h1>
                    <p className="app-page-subtitle">
                        {t('alerts.subtitle', 'Items requiring your attention')}
                    </p>
                </div>
                <button
                    onClick={fetchLowStock}
                    className="btn-secondary flex items-center gap-2 self-start sm:self-auto"
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
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 sm:py-16 bg-card rounded-2xl border border-border/50 shadow-sm px-6"
                >
                    <div className="w-14 h-14 bg-success-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Package className="w-7 h-7 text-success-500" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                        {t('alerts.allGood', 'All caught up!')}
                    </h3>
                    <p className="text-sm text-foreground-muted max-w-sm mx-auto">
                        {t('alerts.noLowStock', 'Your inventory is healthy. No items are currently below their minimum stock level.')}
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="group bg-card p-4 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <AlertTriangle className="w-5 h-5 text-warning-500" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                                        {item.name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-foreground-muted">
                                        <span className="flex items-center gap-1">
                                            {t('common.sku', 'SKU')}:
                                            <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">{item.sku}</span>
                                        </span>
                                        <span>{item.category?.name || 'Uncategorized'}</span>
                                    </div>
                                </div>

                                {/* Stock + Action */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="text-right">
                                        <div className="text-base sm:text-lg font-bold text-error-500 tabular-nums leading-tight">
                                            {item.current_quantity} <span className="text-xs font-normal text-foreground-muted">{item.unit}</span>
                                        </div>
                                        <div className="text-xs text-warning-600 font-medium">
                                            Min: {item.low_stock_threshold || 0}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/transactions?tab=purchases&item=${item.id}`)}
                                        className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                                        title={t('inventory.restock', 'Restock Item')}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
