import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`${sidebarOpen && window.innerWidth >= 1024 ? 'lg:pl-72' : ''}`}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
          
          <footer className="mt-12 pt-8 border-t border-dark-700/50">
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