import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../lib/store';
import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  BarChart3,
  Settings,
  FolderOpen,
  X,
  ShoppingCart,
  Building2,
  Users,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import Logo from './ui/Logo';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const profile = useAuthStore(state => state.profile);

  const navGroups = [
    {
      title: 'Foundation',
      items: [
        { to: '/', icon: LayoutDashboard, label: t('navigation.dashboard') },
        { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
      ]
    },
    {
      title: 'Inventory Hub',
      items: [
        { to: '/inventory/items', icon: Package, label: 'Inventory Manager' },
        { to: '/inventory/categories', icon: FolderOpen, label: t('navigation.categories') },
        { to: '/inventory/valuation', icon: Wallet, label: 'Warehouse Value' },
      ]
    },
    {
      title: 'Procurement',
      items: [
        { to: '/vendors', icon: Building2, label: 'Vendors' },
        { to: '/transactions?tab=purchases&action=new', icon: ShoppingBag, label: 'New Purchase' },
      ]
    },
    {
      title: 'Sales & CRM',
      items: [
        { to: '/customers', icon: Users, label: 'Customers' },
        { to: '/transactions', icon: ArrowUpDown, label: 'History & Logs' },
      ]
    },
    {
      title: 'Insights',
      items: [
        { to: '/expenses', icon: Wallet, label: 'Expenses' },
        { to: '/reports/performance', icon: BarChart3, label: 'Performance' },
        { to: '/settings', icon: Settings, label: t('navigation.settings') },
      ]
    }
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
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Logo size="md" />
              {profile?.business_logo && (
                <img
                  src={profile.business_logo}
                  alt={profile.business_name || 'Business'}
                  className="h-10 w-10 object-contain rounded-lg border border-primary-500/30"
                />
              )}
              {profile?.business_name && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate">
                    {profile.business_name}
                  </span>
                  {profile.business_tagline && (
                    <span className="text-xs text-gray-400 truncate">
                      {profile.business_tagline}
                    </span>
                  )}
                </div>
              )}
            </div>
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
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
            {navGroups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-2">
                <h3 className="px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item, index) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: (groupIndex * 0.1) + (index * 0.05),
                        duration: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                    >
                      <NavLink
                        to={item.to}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }: { isActive: boolean }) =>
                          `group flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 min-h-[44px] touch-manipulation ${isActive
                            ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/20 text-primary-400 border-l-4 border-primary-500 shadow-lg shadow-primary-500/10'
                            : 'text-gray-400 hover:bg-dark-700/50 hover:text-white'
                          }`
                        }
                      >
                        <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110`} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              </div>
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