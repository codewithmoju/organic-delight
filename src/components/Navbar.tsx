import { Bell, Menu, User } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../lib/store';
import Logo from './ui/Logo';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur-sm bg-white/95">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>
      
      <div className="flex flex-1 gap-x-4 self-stretch items-center justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
          </button>
          
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
          
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-x-3 rounded-full p-1.5 text-sm leading-6 text-gray-900 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                className="h-8 w-8 rounded-full bg-gray-50 ring-2 ring-white"
                src={`https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=1e40af&color=fff`}
                alt="Profile"
              />
              <span className="hidden lg:block text-sm font-semibold leading-6 text-gray-900">
                {profile?.full_name || 'User'}
              </span>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Navigate to profile/settings
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <User className="mr-3 h-4 w-4" />
                  Your Profile
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}