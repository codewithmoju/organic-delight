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
  ShoppingCart,
  Building2,
  Users,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import Logo from './ui/Logo';
import { useTranslation } from 'react-i18next';
import { SimpleThemeToggle } from './ui/ThemeToggle';
import { useIsDesktop } from '../hooks/useMediaQuery';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = React.useState(false);
  const isDesktop = useIsDesktop();
  const isExpanded = isHovered || !isDesktop;

  const navGroups = [
    {
      title: t('navigation.groups.foundation'),
      items: [
        { to: '/', icon: LayoutDashboard, label: t('navigation.dashboard') },
        { to: '/pos', icon: ShoppingCart, label: t('navigation.pointOfSale') },
      ]
    },
    {
      title: t('navigation.groups.inventoryHub'),
      items: [
        { to: '/inventory/items', icon: Package, label: t('navigation.inventoryManager') },
        { to: '/inventory/categories', icon: FolderOpen, label: t('navigation.categories') },
        { to: '/inventory/valuation', icon: Wallet, label: t('navigation.warehouseValue') },
      ]
    },
    {
      title: t('navigation.groups.procurement'),
      items: [
        { to: '/vendors', icon: Building2, label: t('navigation.vendors') },
        { to: '/transactions?tab=purchases&action=new', icon: ShoppingBag, label: t('navigation.newPurchase') },
      ]
    },
    {
      title: t('navigation.groups.salesCrm'),
      items: [
        { to: '/customers', icon: Users, label: t('navigation.customers') },
        { to: '/transactions', icon: ArrowUpDown, label: t('navigation.activityLog') },
      ]
    },
    {
      title: t('navigation.groups.insights'),
      items: [
        { to: '/expenses', icon: Wallet, label: t('navigation.expenses') },
        { to: '/reports/performance', icon: BarChart3, label: t('navigation.performance') },
        { to: '/settings', icon: Settings, label: t('navigation.settings') },
      ]
    }
  ];

  // Handle escape key to close sidebar on mobile
  React.useEffect(() => {
    if (isDesktop) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isDesktop]);

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isDesktop) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDesktop]);

  return (
    <>
      {/* Mobile overlay */}
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

      {/* Sidebar */}
      <motion.aside
        data-tour="sidebar"
        initial={false}
        animate={{
          width: isDesktop ? (isHovered ? 256 : 80) : 288,
          x: isOpen || isDesktop ? 0 : -288
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-[rgb(var(--sidebar-bg))] text-[rgb(var(--sidebar-fg))]
          border-r border-white/10 shadow-xl
          lg:translate-x-0 overflow-hidden
          rounded-r-3xl
        `}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transform: 'translate3d(0, 0, 0)',
          contain: 'layout style paint'
        }}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isDesktop && !isOpen ? 'true' : 'false'}
      >
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 h-20">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <div className="flex-shrink-0">
                <Logo size="md" showText={false} className="text-white" />
              </div>
              <motion.div
                animate={{ opacity: isExpanded ? 1 : 0 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-lg font-bold text-white whitespace-nowrap">
                  StockSuit
                </span>
              </motion.div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-3 rounded-lg hover:bg-secondary transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close navigation menu"
              type="button"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 p-4 overflow-y-auto custom-scrollbar overflow-x-hidden ${isExpanded ? 'space-y-4' : 'space-y-1'}`}>
            {navGroups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-1">
                <motion.h3
                  animate={{
                    opacity: isExpanded ? 1 : 0,
                    height: isExpanded ? 'auto' : 0,
                    marginBottom: isExpanded ? 4 : 0
                  }}
                  className="px-4 text-[10px] font-bold uppercase tracking-wider text-white/50 truncate"
                >
                  {group.title}
                </motion.h3>
                <div className="space-y-0.5">
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
                          if (!isDesktop) onClose();
                        }}
                        className={({ isActive }: { isActive: boolean }) =>
                          `group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[40px] touch-manipulation whitespace-nowrap overflow-hidden ${isActive
                            ? 'bg-[rgb(var(--sidebar-active))] text-white shadow-lg'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                            <motion.span
                              animate={{
                                opacity: isExpanded ? 1 : 0,
                                width: isExpanded ? 'auto' : 0,
                                marginLeft: isExpanded ? 12 : 0
                              }}
                              className="font-medium text-sm"
                            >
                              {item.label}
                            </motion.span>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="text-sm font-medium text-muted-foreground">{t('navigation.theme', 'Theme')}</span>
              <SimpleThemeToggle />
            </div>
            <motion.div
              animate={{ opacity: isExpanded ? 1 : 0 }}
              className="text-xs text-muted-foreground text-center space-y-1"
            >
              <div>
                {t('navigation.poweredBy')}
              </div>
              <div>
                {t('app.version')}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;