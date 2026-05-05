import { Menu, User, LogOut, Settings, ChevronDown, Building2, Check } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/store';
import { switchOrganization } from '../lib/auth/orgResolver';
import { getUserOrganizations } from '../lib/api/organizations';
import Logo from './ui/Logo';
import SearchInput from './ui/SearchInput';
import LanguageSelector from './ui/LanguageSelector';
import { SimpleThemeToggle } from './ui/ThemeToggle';
import NotificationCenter from './ui/NotificationCenter';
import LocationSelector from './ui/LocationSelector';
import type { Organization } from '../lib/types/org';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const activeOrganization = useAuthStore((state) => state.activeOrganization);
  const setActiveOrganization = useAuthStore((state) => state.setActiveOrganization);
  const setMembership = useAuthStore((state) => state.setMembership);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const orgButtonRef = useRef<HTMLButtonElement>(null);

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
      if (
        orgDropdownRef.current &&
        orgButtonRef.current &&
        !orgDropdownRef.current.contains(event.target as Node) &&
        !orgButtonRef.current.contains(event.target as Node)
      ) {
        setShowOrgMenu(false);
      }
    }

    // Add event listener when dropdown is open
    if (showUserMenu || showOrgMenu) {
      document.addEventListener('mousedown', handleClickOutside as any);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as any);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [showUserMenu, showOrgMenu]);

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

  // Fetch user's orgs when org menu opens
  useEffect(() => {
    if (!showOrgMenu || !profile?.id) return;
    getUserOrganizations(profile.id).then(setUserOrgs).catch(() => {});
  }, [showOrgMenu, profile?.id]);

  const handleOrgSwitch = useCallback(async (orgId: string) => {
    setShowOrgMenu(false);
    try {
      await switchOrganization(orgId);
    } catch (err) {
      console.error('Failed to switch organization:', err);
    }
  }, []);

  const handleProfileClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuItemClick = (action: () => void) => {
    setShowUserMenu(false);
    action();
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-background/80 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-colors duration-300 border-b border-border/30">
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
      <div className="lg:hidden flex items-center gap-2 min-w-0 overflow-hidden">
        <Logo size="sm" />
        {profile?.business_logo && (
          <img
            src={profile.business_logo}
            alt={profile.business_name || 'Business'}
            className="h-8 w-8 object-contain rounded flex-shrink-0"
          />
        )}
        {profile?.business_name && (
          <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">
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
          {/* Location selector */}
          <LocationSelector />

          {/* Org switcher — only shown when org scoping is active */}
          {activeOrganization && (
            <div className="relative">
              <button
                ref={orgButtonRef}
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors duration-200 text-sm font-medium"
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                aria-expanded={showOrgMenu}
                aria-haspopup="true"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline truncate max-w-[120px]">{activeOrganization.name}</span>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${showOrgMenu ? 'rotate-180' : ''}`} />
              </button>

              {showOrgMenu && (
                <div
                  ref={orgDropdownRef}
                  className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl glass-effect border border-border shadow-lg"
                  role="menu"
                >
                  <div className="py-2">
                    {userOrgs.length <= 1 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground">
                        {activeOrganization.name}
                      </div>
                    ) : (
                      userOrgs.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => handleOrgSwitch(org.id)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150 ${
                            org.id === activeOrganization.id
                              ? 'bg-secondary text-foreground font-medium'
                              : 'text-foreground hover:bg-secondary'
                          }`}
                          role="menuitem"
                        >
                          <span className="truncate">{org.name}</span>
                          {org.id === activeOrganization.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language selector */}
          <div className="hidden sm:block">
            <LanguageSelector variant="compact" showSearch={false} />
          </div>

          {/* Theme Toggle - Circular */}
          <div className="hidden sm:flex items-center justify-center p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors duration-200 cursor-pointer">
            <SimpleThemeToggle />
          </div>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Divider */}
          <div className="hidden lg:block h-8 w-px bg-border mx-2" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              id="user-menu-button"
              type="button"
              className="flex items-center gap-x-3 rounded-full hover:bg-secondary/50 transition-colors duration-200 p-1 pr-3"
              onClick={handleProfileClick}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
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