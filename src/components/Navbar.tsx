import { Bell, Menu, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/store';
import Logo from './ui/Logo';
import SearchInput from './ui/SearchInput';
import LanguageSelector from './ui/LanguageSelector';
import { SimpleThemeToggle } from './ui/ThemeToggle';
import { getLowStockItems } from '../lib/api/lowStock';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Load low stock alerts for the badge
  useEffect(() => {
    const checkStock = async () => {
      try {
        const items = await getLowStockItems();
        setLowStockCount(items.length);
      } catch (error) {
        console.error('Stock check failed:', error);
      }
    };

    checkStock();
    // Re-check every 5 minutes
    const interval = setInterval(checkStock, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
      document.addEventListener('mousedown', handleClickOutside as any);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as any);
      document.removeEventListener('touchstart', handleClickOutside as any);
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
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-transparent px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-3 text-muted-foreground hover:text-foreground lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-secondary transition-colors duration-200"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2">
        <Logo size="sm" />
        {profile?.business_logo && (
          <img
            src={profile.business_logo}
            alt={profile.business_name || 'Business'}
            className="h-8 w-8 object-contain rounded"
          />
        )}
        {profile?.business_name && (
          <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
            {profile.business_name}
          </span>
        )}
      </div>

      {/* Right side content */}
      <div className="flex flex-1 items-center justify-between gap-4">
        {/* Search Bar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block max-w-md w-full">
          <SearchInput
            value=""
            onChange={() => { }}
            placeholder={t('common.search', 'Search here...')}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-x-3 sm:gap-x-4 ml-auto">
          {/* Language selector */}
          <div className="hidden sm:block">
            <LanguageSelector variant="compact" showSearch={false} />
          </div>

          {/* Theme Toggle - Circular */}
          <div className="hidden sm:flex items-center justify-center p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors duration-200 cursor-pointer">
            <SimpleThemeToggle />
          </div>

          {/* Notifications button - Circular */}
          <button
            type="button"
            onClick={() => navigate('/inventory/alerts')}
            className="relative p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-full bg-secondary hover:bg-secondary/80"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {lowStockCount > 0 && (
              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error/75 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-error text-[8px] font-bold text-white items-center justify-center">
                </span>
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="hidden lg:block h-8 w-px bg-border mx-2" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              className="flex items-center gap-x-3 rounded-full hover:bg-secondary/50 transition-colors duration-200 p-1 pr-3"
              onClick={handleProfileClick}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
              aria-label="Open user menu"
            >
              <img
                className="h-9 w-9 rounded-full bg-secondary object-cover ring-2 ring-background"
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=1e40af&color=fff`}
                alt="Profile"
                loading="lazy"
              />
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-bold text-foreground leading-none">
                  {profile?.full_name || 'User'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ml-1 ${showUserMenu ? 'rotate-180' : ''
                }`} />
            </button>

            {/* Dropdown menu with smooth animations */}
            {showUserMenu && (
              <div
                ref={dropdownRef}
                className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl glass-effect border border-border shadow-lg transform opacity-100 scale-100 transition-all duration-200"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                {/* Profile info header */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=1e40af&color=fff`}
                      alt="Profile"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <button
                    onClick={() => handleMenuItemClick(() => navigate('/settings'))}
                    className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
                    role="menuitem"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    {t('settings.profile.editProfile', 'Edit Profile')}
                  </button>

                  <button
                    onClick={() => handleMenuItemClick(() => navigate('/settings'))}
                    className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
                    role="menuitem"
                  >
                    <User className="mr-3 h-4 w-4" />
                    {t('settings.profile.accountSettings', 'Account Settings')}
                  </button>

                  <div className="border-t border-border my-2"></div>

                  <button
                    onClick={() => handleMenuItemClick(signOut)}
                    className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-secondary hover:text-error transition-colors duration-150"
                    role="menuitem"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    {t('auth.signOut', 'Sign out')}
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