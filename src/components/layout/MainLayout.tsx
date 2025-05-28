"use client";

import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  Search, 
  Mail, 
  Users, 
  Send, 
  Menu, 
  Moon, 
  Sun, 
  LogOut, 
  Settings,
  Building2,
  Inbox,
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
  currentModule: 'ai-table' | 'mailbox' | 'crm' | 'email-campaign';
  onModuleChange: (module: 'ai-table' | 'mailbox' | 'crm' | 'email-campaign') => void;
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
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    id: 'mailbox' as const,
    label: 'Mailbox',
    icon: Inbox,
    description: 'Outlook Integration',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  {
    id: 'crm' as const,
    label: 'CRM',
    icon: Users,
    description: 'Customer Management',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  {
    id: 'email-campaign' as const,
    label: 'Email Campaign',
    icon: Send,
    description: 'Marketing Automation',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800'
  }
];



export function MainLayout({ user, children, currentModule, onModuleChange, onLogout, onCustomerView, microsoftAccount, isMicrosoftSignedIn, hasAnyAuth }: MainLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // Desktop sidebar expansion

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
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
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

      <div className="flex flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-40 bg-background border-r transition-all duration-200 ease-in-out
          lg:relative lg:translate-x-0 top-16 lg:top-0 lg:flex-shrink-0
          ${sidebarExpanded ? 'w-72' : 'w-16'}
        `}>
          <div className="flex h-full flex-col">
            {/* Toggle Button */}
            <div className={`flex ${sidebarExpanded ? 'justify-end' : 'justify-center'} p-2 border-b`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="h-8 w-8"
              >
                {sidebarExpanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className={`flex-1 overflow-y-auto ${sidebarExpanded ? 'p-6' : 'p-2'} space-y-4`}>
              <div className="space-y-2">
                {sidebarExpanded && (
                  <h3 className="text-sm font-medium text-muted-foreground">Business Modules</h3>
                )}
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = currentModule === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full ${sidebarExpanded ? 'justify-start h-12' : 'justify-center h-10'} ${
                          isActive 
                            ? `${item.bgColor} ${item.color} border ${item.borderColor} hover:${item.bgColor}` 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          onModuleChange(item.id);
                          setSidebarOpen(false);
                        }}
                        title={!sidebarExpanded ? item.label : undefined}
                      >
                        <item.icon className={`h-5 w-5 ${sidebarExpanded ? 'mr-3' : ''} ${isActive ? item.color : 'text-muted-foreground'}`} />
                        {sidebarExpanded && (
                          <>
                            <div className="flex-1 text-left">
                              <div className={`font-medium ${isActive ? item.color : ''}`}>
                                {item.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                            {item.id === 'crm' && (
                              <Badge variant="secondary" className="ml-auto">
                                New
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden min-h-0">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 