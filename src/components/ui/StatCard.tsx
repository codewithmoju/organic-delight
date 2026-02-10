import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'primary' | 'standard';
    trend?: {
        value: number;
        isUp: boolean;
    };
    isLoading?: boolean;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    variant = 'standard',
    trend,
    isLoading = false,
    onClick
}) => {
    const isPrimary = variant === 'primary';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={onClick ? { scale: 1.02 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 ${isPrimary
                ? 'bg-gradient-to-br from-primary via-primary to-primary-dark border-primary-light/30 shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-slate-900 border-border/50 shadow-sm'
                } ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${isPrimary
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/10 text-primary dark:bg-primary/20'
                    }`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && !isLoading && (
                    <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${isPrimary
                        ? 'bg-white/20 text-white'
                        : trend.isUp ? 'bg-success-500/10 text-success-600 dark:text-success-400' : 'bg-error-500/10 text-error-600 dark:text-error-400'
                        }`}>
                        {trend.isUp ? '↑' : '↓'} {trend.value}%
                    </div>
                )}
            </div>

            <div>
                <p className={`text-sm font-medium mb-1 ${isPrimary ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {label}
                </p>
                {isLoading ? (
                    <div className={`h-8 w-24 animate-pulse rounded-lg ${isPrimary ? 'bg-white/20' : 'bg-primary/5'}`} />
                ) : (
                    <h3 className={`text-2xl font-bold tracking-tight ${isPrimary ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {value}
                    </h3>
                )}
            </div>

            {/* Decorative background element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-20 blur-2xl ${isPrimary ? 'bg-white' : 'bg-primary'
                }`} />
        </motion.div>
    );
};

export default StatCard;
