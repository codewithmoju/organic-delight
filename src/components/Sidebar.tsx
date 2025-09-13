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
  Layers,
  ShoppingCart
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
    { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
    { to: '/inventory/categories', icon: FolderOpen, label: t('navigation.categories') },
    { to: '/inventory/items', icon: Package, label: t('navigation.items') },
    { to: '/transactions', icon: ArrowUpDown, label: t('navigation.transactions') },
    { to: '/stock-levels', icon: Layers, label: t('navigation.stockLevels') },
    { to: '/reports', icon: BarChart3, label: t('navigation.reports') },
    { to: '/settings', icon: Settings, label: t('navigation.settings') },
  ];

  // Handle escape key to close sidebar on mobile
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    // Only add listener on mobile screens
    if (window.innerWidth < 1024) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  return (
    <>
      {/* Mobile overlay - appears only on screens < 1024px */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar - responsive behavior with smooth animations */}
      <motion.aside 
        data-tour="sidebar"
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -288 // 288px = w-72 (18rem)
        }}
        transition={{ 
          type: "tween",
          duration: window.innerWidth <= 768 ? 0.25 : 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className={`
          fixed inset-y-0 left-0 z-50 w-72 glass-effect border-r border-dark-700/50 flex flex-col sidebar-optimized
          lg:translate-x-0
        `}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transform: 'translate3d(0, 0, 0)',
          contain: 'layout style paint'
        }}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isOpen ? 'true' : 'false'}
      >
        <div className="flex flex-col h-full">
          {/* Header with logo and close button */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
            <Logo size="md" animated />
            {/* Close button - visible on mobile only, minimum 44px touch target */}
            <button
              onClick={onClose}
              className="lg:hidden p-3 rounded-lg hover:bg-dark-700/50 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close navigation menu"
              type="button"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Navigation menu with staggered animations */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: window.innerWidth <= 768 ? index * 0.05 : index * 0.1,
                  duration: 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <NavLink
                  to={item.to}
                  onClick={() => {
                    // Only close sidebar on mobile screens
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 rounded-xl transition-colors duration-150 min-h-[48px] touch-manipulation ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/20 text-primary-400 border-l-4 border-primary-500'
                        : 'text-gray-300 hover:bg-dark-700/50 hover:text-white'
                    }`
                  }
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                    backfaceVisibility: 'hidden',
                    touchAction: 'manipulation'
                  }}
                  aria-current={({ isActive }) => isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 mr-3 transition-transform duration-150 group-hover:scale-110" 
                    style={{ transform: 'translate3d(0, 0, 0)' }} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-dark-700/50">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <div>
                Powered by NAM STUDIOS
              </div>
              <div>
              {t('app.version')}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;