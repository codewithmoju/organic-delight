import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpDown, 
  BarChart3, 
  Settings,
  FolderOpen,
  Layers,
  ShoppingCart,
  Menu,
  X
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { hapticsService } from '../../lib/capacitor/haptics';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
    { to: '/inventory/categories', icon: FolderOpen, label: 'Categories' },
    { to: '/inventory/items', icon: Package, label: 'Items' },
    { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
    { to: '/stock-levels', icon: Layers, label: 'Stock Levels' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = async (path: string) => {
    if (Capacitor.isNativePlatform()) {
      await hapticsService.lightTap();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Mobile Navigation Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
                <div className="flex items-center space-x-3">
                  <Package className="w-8 h-8 text-primary-500" />
                  <span className="text-xl font-bold text-gradient">StockSuite</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </motion.button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <NavLink
                      to={item.to}
                      onClick={() => handleNavClick(item.to)}
                      className={({ isActive }) =>
                        `group flex items-center px-4 py-4 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/20 text-primary-400 border-l-4 border-primary-500'
                            : 'text-gray-300 hover:bg-dark-700/50 hover:text-white active:bg-dark-600/50'
                        }`
                      }
                      style={{
                        touchAction: 'manipulation',
                        minHeight: '56px' // Ensure adequate touch target
                      }}
                    >
                      <item.icon className="w-6 h-6 mr-4 transition-transform duration-200 group-hover:scale-110" />
                      <span className="font-medium text-lg">{item.label}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-dark-700/50">
                <div className="text-center text-sm text-gray-500">
                  <div>StockSuite Mobile</div>
                  <div>v2.0.0</div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}