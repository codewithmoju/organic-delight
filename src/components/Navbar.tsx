import { Bell, Menu, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside functionality to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    // Add event listener when dropdown is open
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserMenu]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && showUserMenu) {
        setShowUserMenu(false);
        buttonRef.current?.focus(); // Return focus to trigger button
      }
    }

    if (showUserMenu) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const handleProfileClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuItemClick = (action: () => void) => {
    setShowUserMenu(false);
    action();
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 glass-effect border-b border-dark-700/50 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-3 text-gray-400 hover:text-gray-200 lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-dark-700/50 transition-colors duration-200"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      {/* Mobile logo */}
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>
      
      {/* Right side content */}
      <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch items-center justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Language selector - hidden on small screens */}
          <LanguageSelector variant="compact" showSearch={false} className="hidden sm:block" />
          
          {/* Notifications button */}
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-200 transition-colors duration-200 rounded-lg hover:bg-dark-700/50"
            aria-label="View notifications"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
          </button>
          
          {/* Divider */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-dark-700" />
          
          {/* Profile dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              className="flex items-center gap-x-2 sm:gap-x-3 rounded-xl p-2 text-sm leading-6 text-gray-200 hover:bg-dark-700/50 transition-colors duration-200"
              onClick={handleProfileClick}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
              aria-label="Open user menu"
            >
              <img
                className="h-8 w-8 rounded-full bg-dark-700 ring-2 ring-primary-500/50"
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=1e40af&color=fff`}
                alt="Profile"
                loading="lazy"
              />
              <span className="hidden sm:block text-sm font-semibold leading-6 text-gray-200 truncate max-w-[120px]">
                {profile?.full_name || 'User'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                showUserMenu ? 'rotate-180' : ''
              }`} />
            </button>
            
            {/* Dropdown menu with smooth animations */}
            {showUserMenu && (
              <div 
                ref={dropdownRef}
                className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl glass-effect border border-dark-700/50 shadow-dark-lg transform opacity-100 scale-100 transition-all duration-200"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                {/* Profile info header */}
                <div className="px-4 py-3 border-b border-dark-700/50">
                  <div className="flex items-center space-x-3">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=1e40af&color=fff`}
                      alt="Profile"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {profile?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <button
                    onClick={() => handleMenuItemClick(() => navigate('/settings'))}
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-white transition-colors duration-150"
                    role="menuitem"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Edit Profile
                  </button>
                  
                  <button
                    onClick={() => handleMenuItemClick(() => navigate('/settings'))}
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-white transition-colors duration-150"
                    role="menuitem"
                  >
                    <User className="mr-3 h-4 w-4" />
                    Account Settings
                  </button>
                  
                  <div className="border-t border-dark-700/50 my-2"></div>
                  
                  <button
                    onClick={() => handleMenuItemClick(signOut)}
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-red-400 transition-colors duration-150"
                    role="menuitem"
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