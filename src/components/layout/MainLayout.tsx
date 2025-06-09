"use client";

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { routePreloader } from '@/shared/services/RoutePreloader';
import { 
  Search, 
  Menu, 
  Moon, 
  Sun, 
  LogOut, 
  Settings,
  ChevronLeft,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface MainLayoutProps {
  user: User | null;
  children: React.ReactNode;
  currentModule: 'ai-table';
  onModuleChange: (module: 'ai-table') => void;
  onLogout: () => void;
  onCustomerView?: (customerId: string) => void;
  microsoftAccount?: any;
  isMicrosoftSignedIn?: boolean;
  hasAnyAuth?: boolean;
}

const navigationItems = [
  {
    id: 'ai-table' as const,
    label: 'AI Table',
    icon: Search,
    description: 'Lead Prospection',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    activeBg: 'bg-blue-600 dark:bg-blue-600'
  }
];

export function MainLayout({ user, children, currentModule, onModuleChange, onLogout, onCustomerView, microsoftAccount, isMicrosoftSignedIn, hasAnyAuth }: MainLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Initialize route preloader and warm up
  useEffect(() => {
    routePreloader.configure({
      preloadComponents: true,
      preloadData: true,
      preloadOnHover: true,
      preloadOnVisible: true
    });

    // Warm up critical routes
    routePreloader.warmUp();
  }, []);

  // Track navigation changes for intelligent prefetching
  useEffect(() => {
    setNavigationHistory(prev => {
      const newHistory = [...prev, currentModule];
      if (newHistory.length > 10) newHistory.shift();
      
      // Trigger intelligent preloading based on patterns
      routePreloader.preloadBasedOnPattern(currentModule, newHistory);
      
      return newHistory;
    });
  }, [currentModule]);

  // Enhanced module change with preloading
  const handleModuleChange = (module: typeof currentModule) => {
    // Preload with high priority for immediate navigation
    routePreloader.preloadRoute(module, { priority: 'high', immediate: true });
    onModuleChange(module);
  };

  const getUserInitials = (user: User) => {
    // Try to get name from various metadata fields
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name;
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const email = user.email || '';

    // If we have a full name, use it
    if (fullName) {
      const nameParts = fullName.trim().split(' ').filter((part: string) => part.length > 0);
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      } else if (nameParts.length === 1) {
        return nameParts[0].slice(0, 2).toUpperCase();
      }
    }

    // If we have first and last name separately
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    // If we only have first name
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }

    // Fall back to email
    if (email) {
      const emailName = email.split('@')[0];
      if (emailName.length >= 2) {
        return emailName.slice(0, 2).toUpperCase();
      }
      return emailName.toUpperCase();
    }

    return 'U';
  };

  const getUserDisplayName = (user: User) => {
    // Try various name fields in order of preference
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name;
    if (fullName) return fullName;

    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;

    // Fall back to email username (before @)
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // Convert email-style names to readable format (e.g., "john.doe" -> "John Doe")
      return emailName
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }

    return 'User';
  };

  // Get display info for current authenticated user (Supabase or Microsoft)
  const getCurrentUserInfo = () => {
    if (user) {
      return {
        displayName: getUserDisplayName(user),
        email: user.email || '',
        initials: getUserInitials(user),
        isConnected: true,
        authType: 'Supabase'
      };
    } else if (isMicrosoftSignedIn && microsoftAccount) {
      // Microsoft user info
      const displayName = microsoftAccount.name || microsoftAccount.username || 'Microsoft User';
      const email = microsoftAccount.username || '';
      
      // Generate initials from Microsoft account
      let initials = 'U';
      if (microsoftAccount.name) {
        const nameParts = microsoftAccount.name.trim().split(' ').filter((part: string) => part.length > 0);
        if (nameParts.length >= 2) {
          initials = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        } else if (nameParts.length === 1) {
          initials = nameParts[0].slice(0, 2).toUpperCase();
        }
      } else if (email) {
        const emailName = email.split('@')[0];
        initials = emailName.slice(0, 2).toUpperCase();
      }
      
      return {
        displayName,
        email,
        initials,
        isConnected: true,
        authType: 'Microsoft'
      };
    }
    
    return {
      displayName: 'Not Connected',
      email: 'Please sign in to access all features',
      initials: 'U',
      isConnected: false,
      authType: 'None'
    };
  };

  const userInfo = getCurrentUserInfo();
  const currentItem = navigationItems.find(item => item.id === currentModule);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex-shrink-0">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Business Suite</h1>
                {currentItem && (
                  <p className="text-xs text-muted-foreground">{currentItem.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            {/* Current Module Indicator */}
            {currentItem && (
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${currentItem.bgColor} ${currentItem.borderColor} border`}>
                <currentItem.icon className={`h-4 w-4 ${currentItem.color}`} />
                <span className={`text-sm font-medium ${currentItem.color}`}>
                  {currentItem.label}
                </span>
              </div>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={userInfo.displayName} />
                    <AvatarFallback className="text-sm">
                      {userInfo.initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Connection Status Indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                    userInfo.isConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium leading-none">
                        {userInfo.displayName}
                      </p>
                      <div className={`h-2 w-2 rounded-full ${userInfo.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userInfo.email}
                    </p>
                    {userInfo.isConnected && (
                      <p className="text-xs leading-none text-green-600 dark:text-green-400 font-medium">
                        ● Connected via {userInfo.authType}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userInfo.isConnected && (
                  <>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={onLogout}
                  className={userInfo.isConnected ? "text-red-600 dark:text-red-400" : ""}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{userInfo.isConnected ? 'Sign Out' : 'Sign In'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom Floating Navigation Island */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background/95 backdrop-blur-md border rounded-2xl shadow-2xl p-2">
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = currentModule === item.id;
              return (
                <div key={item.id} className="relative group">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    className={`h-12 w-12 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? `${item.activeBg} text-white hover:${item.activeBg}` 
                        : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => handleModuleChange(item.id)}
                    onMouseEnter={() => routePreloader.preloadOnHover(item.id)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.id === 'crm' && !isActive && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                    )}
                  </Button>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-foreground text-background text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                      {item.label}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 