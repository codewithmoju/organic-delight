import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  ArrowUpDown,
  Wallet,
  ShieldCheck,
  Settings,
  Shield,
  FileText,
  X,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '../ui/Logo';
import { SimpleThemeToggle } from '../ui/ThemeToggle';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useAuthStore } from '../../lib/store';
import { resolveActiveOrganization } from '../../lib/auth/orgResolver';

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'Business',
    items: [
      { to: '/super-admin/stores', icon: Building2, label: 'Stores' },
      { to: '/super-admin/users', icon: Users, label: 'Users' },
    ],
  },
  {
    title: 'Data Explorer',
    items: [
      { to: '/super-admin/data/items', icon: Package, label: 'Inventory' },
      { to: '/super-admin/data/transactions', icon: ArrowUpDown, label: 'Transactions' },
      { to: '/super-admin/data/expenses', icon: Wallet, label: 'Expenses' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/super-admin/roles', icon: ShieldCheck, label: 'Roles' },
      { to: '/super-admin/documents', icon: FileText, label: 'Documents' },
      { to: '/super-admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/super-admin/audit', icon: Shield, label: 'Audit Log' },
    ],
  },
];

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isOpen, onClose }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleSwitchToClient = async () => {
    if (!user?.uid) return;
    try {
      // Temporarily clear super admin flag so org resolution runs normally
      const store = useAuthStore.getState();
      store.setIsSuperAdmin(false);
      try {
        await resolveActiveOrganization(user.uid);
      } finally {
        // Restore super admin flag regardless of outcome
        store.setIsSuperAdmin(true);
      }
      const updated = useAuthStore.getState();
      if (updated.activeOrganization) {
        navigate('/');
        toast.success(`Switched to ${updated.activeOrganization.name}`);
      } else {
        toast.error('No client organization found. Create one from the client panel first.');
      }
    } catch (err) {
      console.error('Failed to resolve client org:', err);
      toast.error('Failed to switch to client panel');
    }
  };
  const isExpanded = isHovered || !isDesktop;

  React.useEffect(() => {
    if (isDesktop) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isDesktop]);

  React.useEffect(() => {
    if (isDesktop) return;
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, isDesktop]);

  return (
    <>
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

      <motion.aside
        initial={false}
        animate={{
          width: isDesktop ? (isHovered ? 256 : 80) : 288,
          x: isOpen || isDesktop ? 0 : -288,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
          contain: 'layout style paint',
        }}
        role="navigation"
        aria-label="Super admin navigation"
        {...(!isDesktop && !isOpen ? { inert: '' } : {})}
      >
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 h-20">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <div className="flex-shrink-0">
                <Logo size="md" showText={false} className="text-white" />
              </div>
              <motion.div
                initial={false}
                animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0 overflow-hidden"
              >
                <span className="text-lg font-bold text-white whitespace-nowrap">StockSuit</span>
                <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider whitespace-nowrap">
                  Super Admin
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
                  initial={false}
                  animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 text-[10px] font-bold uppercase tracking-wider text-white/50 truncate overflow-hidden"
                  style={{ paddingBottom: isExpanded ? 4 : 0 }}
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
                        delay: groupIndex * 0.1 + index * 0.05,
                        duration: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === '/super-admin'}
                        onClick={() => { if (!isDesktop) onClose(); }}
                        className={({ isActive }: { isActive: boolean }) =>
                          `group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[40px] touch-manipulation whitespace-nowrap overflow-hidden ${
                            isActive
                              ? 'bg-[rgb(var(--sidebar-active))] text-white shadow-lg'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                            <motion.span
                              initial={false}
                              animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -8 }}
                              transition={{ duration: 0.2 }}
                              className="font-medium text-sm ml-3 whitespace-nowrap overflow-hidden"
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
          <div className="p-4 space-y-3">
            {/* Switch to Client Panel */}
            <button
              onClick={handleSwitchToClient}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-300 hover:bg-orange-500/10 hover:text-orange-200 transition-all duration-200 min-h-[40px] touch-manipulation overflow-hidden"
            >
              <ArrowLeftRight className="w-5 h-5 flex-shrink-0" />
              <motion.span
                initial={false}
                animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -8 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Switch to Client Panel
              </motion.span>
            </button>

            <div className="flex items-center justify-between lg:hidden">
              <span className="text-sm font-medium text-muted-foreground">Theme</span>
              <SimpleThemeToggle />
            </div>
            <motion.div
              initial={false}
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted-foreground text-center space-y-1 overflow-hidden"
            >
              <div>Super Admin Panel</div>
            </motion.div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default SuperAdminSidebar;
