import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  LayoutDashboard,
  Building2,
  MessageSquare,
  Users,
  BookOpen,
  FileText,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  Scale,
  Code2,
  Wrench,
  Lightbulb,
  PiggyBank,
  ChevronDown,
  User,
  UserCircle,
  Construction
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isEnabled?: boolean;
  children?: NavItem[];
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCompanyAccess = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Check if user owns any companies
        const { data: ownedCompanies, error: ownedError } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id);

        if (ownedError) throw ownedError;

        if (ownedCompanies && ownedCompanies.length > 0) {
          setHasCompany(true);
          return;
        }

        // Check if user is a member of any companies
        const { data: memberships, error: memberError } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        setHasCompany(memberships && memberships.length > 0);
      } catch (error) {
        console.error('Error checking company access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompanyAccess();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, isEnabled: true },
    { 
      name: 'My Company', 
      href: hasCompany ? '/company/dashboard' : '/company/setup', 
      icon: Building2,
      badge: !hasCompany && !isLoading ? 'Setup' : undefined,
      isEnabled: true
    },
    { name: 'Messages', href: '/messages', icon: MessageSquare, isEnabled: true },
    { name: 'Community', href: '/community', icon: Users, isEnabled: true },
    { name: 'Directory', href: '/directory', icon: BookOpen, isEnabled: true },
    { name: 'Library', href: '#', icon: FileText, isEnabled: false },
    { name: 'Marketplace', href: '#', icon: Wallet, isEnabled: false },
    { name: 'Legal Hub', href: '#', icon: Scale, isEnabled: false },
    { name: 'Dev Hub', href: '#', icon: Code2, isEnabled: false },
    { name: 'Utilities', href: '#', icon: Wrench, isEnabled: false },
    { name: 'Idea Hub', href: '/idea-hub', icon: Lightbulb, isEnabled: true },
    { name: 'Finance Hub', href: '#', icon: PiggyBank, isEnabled: false },
    { name: 'Settings', href: '/profile', icon: Settings, isEnabled: true, children: [
      ...(isAdmin ? [{ name: 'Admin Panel', href: '/admin', icon: Shield, isEnabled: true }] : [])
    ]},
  ];

  const renderNavItem = (item: NavItem) => {
    if (!item.isEnabled) {
      return (
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-md group">
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
                <Construction className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm"
                sideOffset={5}
              >
                Coming Soon
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    return (
      <Link
        to={item.href}
        className={`${
          location.pathname === item.href
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
      >
        <item.icon
          className={`${
            location.pathname === item.href
              ? 'text-indigo-600'
              : 'text-gray-400 group-hover:text-gray-500'
          } mr-3 h-5 w-5`}
        />
        {item.name}
        {item.badge && (
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderMobileNavItem = (item: NavItem) => {
    if (!item.isEnabled) {
      return (
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-400 flex items-center cursor-not-allowed group">
                <item.icon className="h-5 w-5 mr-2" />
                {item.name}
                <Construction className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm"
                sideOffset={5}
              >
                Coming Soon
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    return (
      <Link
        to={item.href}
        className={`${
          location.pathname === item.href
            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <item.icon className="h-5 w-5 mr-2" />
        {item.name}
        {item.badge && (
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="hidden lg:ml-6 lg:flex lg:items-center">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search resources..."
                      type="search"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <div className="ml-4 relative">
                <div>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                      {profile?.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={profile.avatar_url}
                          alt=""
                        />
                      ) : (
                        <UserCircle className="h-8 w-8 text-gray-400" />
                      )}
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-700">
                          {profile?.full_name || 'Complete Profile'}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {profile?.role || 'New User'}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                </div>
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                    {!profile?.full_name ? (
                      <Link
                        to="/profile-setup"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Complete Profile
                      </Link>
                    ) : (
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Your Profile
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-4 flex items-center lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <React.Fragment key={item.name}>
                  {renderMobileNavItem(item)}
                  {item.children?.map((child) => (
                    <React.Fragment key={child.name}>
                      {child.isEnabled ? (
                        <Link
                          to={child.href}
                          className={`${
                            location.pathname === child.href
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                          } block pl-8 pr-4 py-2 border-l-4 text-sm font-medium flex items-center`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <child.icon className="h-4 w-4 mr-2" />
                          {child.name}
                        </Link>
                      ) : (
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <div className="block pl-8 pr-4 py-2 border-l-4 border-transparent text-sm font-medium text-gray-400 flex items-center cursor-not-allowed group">
                                <child.icon className="h-4 w-4 mr-2" />
                                {child.name}
                                <Construction className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm"
                                sideOffset={5}
                              >
                                Coming Soon
                                <Tooltip.Arrow className="fill-gray-900" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Left Sidebar and Main Content */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <React.Fragment key={item.name}>
                    {renderNavItem(item)}
                    {item.children?.map((child) => (
                      <React.Fragment key={child.name}>
                        {child.isEnabled ? (
                          <Link
                            to={child.href}
                            className={`${
                              location.pathname === child.href
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            } group flex items-center px-8 py-2 text-sm font-medium rounded-md`}
                          >
                            <child.icon
                              className={`${
                                location.pathname === child.href
                                  ? 'text-indigo-600'
                                  : 'text-gray-400 group-hover:text-gray-500'
                              } mr-3 h-4 w-4`}
                            />
                            {child.name}
                          </Link>
                        ) : (
                          <Tooltip.Provider>
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <div className="flex items-center px-8 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-md group">
                                  <child.icon className="h-4 w-4 mr-3" />
                                  {child.name}
                                  <Construction className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content
                                  className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm"
                                  sideOffset={5}
                                >
                                  Coming Soon
                                  <Tooltip.Arrow className="fill-gray-900" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          </Tooltip.Provider>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}