import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, BarChart3, Settings, Receipt } from 'lucide-react';
import POSInterface from '../components/pos/POSInterface';
import SalesReports from '../components/pos/SalesReports';
import POSSettings from '../components/pos/POSSettings';

type POSView = 'interface' | 'reports' | 'settings';

export default function POS() {
  const [activeView, setActiveView] = useState<POSView>('interface');

  const views = [
    { id: 'interface', label: 'POS Terminal', icon: ShoppingCart },
    { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
    { id: 'settings', label: 'POS Settings', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Point of Sale</h1>
          <p className="text-gray-400 mt-1">
            Professional retail and billing system
          </p>
        </div>
        
        {/* View Selector */}
        <div className="flex bg-dark-700/50 rounded-xl p-1 border border-dark-600/50">
          {views.map((view, index) => (
            <motion.button
              key={view.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === view.id
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-gray-300 hover:text-white hover:bg-dark-600/50'
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* View Content */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'interface' && <POSInterface />}
        {activeView === 'reports' && <SalesReports />}
        {activeView === 'settings' && <POSSettings />}
      </motion.div>
    </div>
  );
}