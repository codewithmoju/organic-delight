import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useIsDesktop } from '../hooks/useMediaQuery';
import OfflineIndicator from './ui/OfflineIndicator';

export default function Layout() {
  const isDesktop = useIsDesktop();
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`${sidebarOpen && isDesktop ? 'lg:pl-20' : ''} transition-all duration-300`}>
        <OfflineIndicator />
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-[calc(100vh-4rem)] px-4 pt-2 pb-4 sm:px-6 lg:px-8 lg:pt-2 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>

          <footer className="mt-12 pt-8 border-t border-border">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-xs text-gray-500">
                Powered by NAM STUDIOS
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}