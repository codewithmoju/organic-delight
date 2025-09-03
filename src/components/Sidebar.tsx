import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Tags,
  History,
  FileBarChart,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import Logo from './ui/Logo';
import { useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Items', href: '/inventory/items', icon: Package },
  { name: 'Categories', href: '/inventory/categories', icon: Tags },
  { name: 'Transactions', href: '/transactions', icon: History },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-50 flex w-72 flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:inset-auto`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 shadow-xl lg:shadow-none">
          {/* Mobile close button */}
          <div className="flex h-16 shrink-0 items-center justify-between lg:justify-start">
            <Logo size="md" />
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Desktop logo */}
          <div className="hidden lg:flex h-16 shrink-0 items-center">
            <Logo size="md" />
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={onClose}
                          className={`
                            group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-all duration-200
                            ${isActive
                              ? 'bg-blue-50 text-blue-700 shadow-sm'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                            }
                          `}
                        >
                          <item.icon
                            className={`h-6 w-6 shrink-0 transition-colors duration-200 ${
                              isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                            }`}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleSignOut}
                  className="group -mx-2 flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full"
                >
                  <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-700 transition-colors duration-200" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
        <div className="flex h-16 shrink-0 items-center">
          <Package className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-semibold">Inventory Pro</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                          ${isActive
                            ? 'bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                          }`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <button
                onClick={() => signOut()}
                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
              >
                <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600" />
                Sign out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}