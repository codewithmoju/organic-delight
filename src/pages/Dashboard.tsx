import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { StatsCard } from '../components/dashboard/StatsCard';
import { MetricsCard } from '../components/dashboard/MetricsCard';
import { MetricsChart } from '../components/dashboard/MetricsChart';
import { InventoryChart } from '../components/dashboard/InventoryChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { LowStockAlert } from '../components/dashboard/LowStockAlert';
import { TimePeriodFilter } from '../components/dashboard/TimePeriodFilter';
import AnimatedCard from '../components/ui/AnimatedCard';
import { getDashboardData } from '../lib/api/dashboard';
import { DashboardData } from '../lib/types';

export default function Dashboard() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timePeriod, setTimePeriod] = useState('7d');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardData(timePeriod);
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timePeriod]);

  // Simple loading state for initial render
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-dark p-6 h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card-dark p-6 h-80"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">{t('dashboard.noData')}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t('dashboard.title')}
        </h1>
        <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <AnimatedCard delay={0.1}>
          <StatsCard
            title={t('dashboard.totalItems')}
            value={dashboardData.totalItems}
            change={dashboardData.itemsChange}
            icon="Package"
          />
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <StatsCard
            title={t('dashboard.totalValue')}
            value={`$${dashboardData.totalValue.toLocaleString()}`}
            change={dashboardData.valueChange}
            icon="DollarSign"
          />
        </AnimatedCard>
        <AnimatedCard delay={0.3}>
          <StatsCard
            title={t('dashboard.lowStock')}
            value={dashboardData.lowStockItems}
            change={dashboardData.lowStockChange}
            icon="AlertTriangle"
            variant="warning"
          />
        </AnimatedCard>
        <AnimatedCard delay={0.4}>
          <StatsCard
            title={t('dashboard.recentTransactions')}
            value={dashboardData.recentTransactions}
            change={dashboardData.transactionsChange}
            icon="TrendingUp"
          />
        </AnimatedCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-2">
        <AnimatedCard delay={0.5}>
          <MetricsChart data={dashboardData.metricsData} />
        </AnimatedCard>
        <AnimatedCard delay={0.6}>
          <InventoryChart data={dashboardData.inventoryData} />
        </AnimatedCard>
      </div>

      {/* Additional Components */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-2">
        <AnimatedCard delay={0.7}>
          <RecentTransactions transactions={dashboardData.transactions} />
        </AnimatedCard>
        <AnimatedCard delay={0.8}>
          <LowStockAlert items={dashboardData.lowStockItemsList} />
        </AnimatedCard>
      </div>
    </motion.div>
  );
}