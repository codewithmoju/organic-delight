import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Default to open on desktop, closed on mobile
    return typeof window !== 'undefined' && window.innerWidth >= 1024;
  });

  // Handle window resize to manage sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop: keep sidebar open
        setSidebarOpen(true);
      } else {
        // Mobile: close sidebar
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content wrapper - responsive margin for sidebar */}
      <div className={`transition-all duration-300 ${sidebarOpen && window.innerWidth >= 1024 ? 'lg:pl-72' : ''}`}>
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Main content */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
          
          {/* Footer Attribution */}
          <footer className="mt-12 pt-8 border-t border-dark-700/50">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-xs text-gray-500">
                Powered by NAM STUDIOS
              </p>
            </div>
          </footer>
        </motion.main>
      </div>
    </div>
  );
}