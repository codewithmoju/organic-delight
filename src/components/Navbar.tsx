import { Bell, Menu, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import Logo from './ui/Logo';
import LanguageSelector from './ui/LanguageSelector';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 glass-effect border-b border-dark-700/50 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-3 text-gray-400 hover:text-gray-200 lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-dark-700/50"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>
      
      <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch items-center justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <LanguageSelector variant="compact" showSearch={false} className="hidden sm:block" />
          
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-200"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
          </button>
          
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-dark-700" />
          
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-x-2 sm:gap-x-3 rounded-xl p-2 text-sm leading-6 text-gray-200 hover:bg-dark-700/50"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                className="h-8 w-8 rounded-full bg-dark-700 ring-2 ring-primary-500/50"
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=1e40af&color=fff`}
                alt="Profile"
              />
              <span className="hidden sm:block text-sm font-semibold leading-6 text-gray-200 truncate max-w-[120px]">
                {profile?.full_name || 'User'}
              </span>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl glass-effect border border-dark-700/50 shadow-dark-lg">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-white"
                  >
                    <User className="mr-3 h-4 w-4" />
                    Your Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-red-400"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}