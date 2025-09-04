import { Bell, Menu, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../lib/store';
import Logo from './ui/Logo';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 glass-effect border-b border-dark-700/50 px-4 sm:gap-x-6 sm:px-6 lg:px-8"
    >
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-200 lg:hidden transition-colors duration-200"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>
      
      <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch items-center justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
          </motion.button>
          
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-dark-700" />
          
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="flex items-center gap-x-2 sm:gap-x-3 rounded-xl p-2 text-sm leading-6 text-gray-200 hover:bg-dark-700/50 transition-all duration-200"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <motion.img
                className="h-8 w-8 rounded-full bg-dark-700 ring-2 ring-primary-500/50"
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=1e40af&color=fff`}
                alt="Profile"
                whileHover={{ scale: 1.1 }}
              />
              <span className="hidden sm:block text-sm font-semibold leading-6 text-gray-200 truncate max-w-[120px]">
                {profile?.full_name || 'User'}
              </span>
            </motion.button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl glass-effect border border-dark-700/50 shadow-dark-lg"
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-white transition-colors duration-200"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Your Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-red-400 transition-colors duration-200"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}