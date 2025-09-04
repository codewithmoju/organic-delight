import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpDown, 
  BarChart3, 
  Settings,
  FolderOpen,
  X,
  Layers
} from 'lucide-react';
import Logo from './ui/Logo';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { to: '/inventory/categories', icon: FolderOpen, label: t('navigation.categories') },
    { to: '/inventory/items', icon: Package, label: t('navigation.items') },
    { to: '/transactions', icon: ArrowUpDown, label: t('navigation.transactions') },
    { to: '/stock-levels', icon: Layers, label: t('navigation.stockLevels') },
    { to: '/reports', icon: BarChart3, label: t('navigation.reports') },
    { to: '/settings', icon: Settings, label: t('navigation.settings') },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside 
        data-tour="sidebar"
        initial={{ x: -300 }}
        animate={{ 
          x: typeof window !== 'undefined' && (isOpen || window.innerWidth >= 1024) ? 0 : -300 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed inset-y-0 left-0 z-50 w-72 glass-effect border-r border-dark-700/50
          lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
            <Logo size="md" animated />
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/20 text-primary-400 border-l-4 border-primary-500'
                        : 'text-gray-300 hover:bg-dark-700/50 hover:text-white'
                    }`
                  }
                  onClick={() => onClose()}
                >
                  <item.icon className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-dark-700/50">
            <div className="text-xs text-gray-500 text-center">
              {t('app.version')}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;