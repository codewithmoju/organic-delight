import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import MobileNavigation from './MobileNavigation';
import { useAuthStore } from '../../lib/store';
import { hapticsService } from '../../lib/capacitor/haptics';

export default function MobileOptimizedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
  const profile = useAuthStore((state) => state.profile);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializeMobileLayout();
    }
  }, []);

  const initializeMobileLayout = async () => {
    try {
      // Get safe area insets for notched devices
      if (Capacitor.getPlatform() === 'ios') {
        // iOS safe area handling
        const statusBarInfo = await StatusBar.getInfo();
        setSafeAreaInsets({
          top: statusBarInfo.height || 44,
          bottom: 34 // Standard iOS home indicator height
        });
      } else if (Capacitor.getPlatform() === 'android') {
        // Android safe area handling
        setSafeAreaInsets({
          top: 24, // Standard Android status bar
          bottom: 0
        });
      }
    } catch (error) {
      console.error('Mobile layout initialization error:', error);
    }
  };

  const handleMenuClick = async () => {
    if (Capacitor.isNativePlatform()) {
      await hapticsService.lightTap();
    }
    setSidebarOpen(true);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
      style={{
        paddingTop: Capacitor.isNativePlatform() ? `${safeAreaInsets.top}px` : 0,
        paddingBottom: Capacitor.isNativePlatform() ? `${safeAreaInsets.bottom}px` : 0
      }}
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 glass-effect border-b border-dark-700/50 px-4">
        {/* Menu Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleMenuClick}
          className="p-3 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-dark-700/50 transition-colors duration-200"
          style={{
            minWidth: '48px',
            minHeight: '48px',
            touchAction: 'manipulation'
          }}
        >
          <Menu className="h-6 w-6" />
        </motion.button>
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="text-xl font-bold text-gradient">StockSuite</span>
        </div>
        
        {/* Right side */}
        <div className="flex-1 flex justify-end">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-3 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-dark-700/50 transition-colors duration-200 relative"
            style={{
              minWidth: '48px',
              minHeight: '48px',
              touchAction: 'manipulation'
            }}
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full" />
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <main className="p-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile-specific styles */}
      <style jsx>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .keyboard-open {
          height: calc(100vh - env(keyboard-height, 0px));
        }
        .offline {
          filter: grayscale(50%);
        }
        .offline::before {
          content: 'Offline Mode';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ef4444;
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 14px;
          z-index: 9999;
        }
      `}</style>
    </div>
  );
}