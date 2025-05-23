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
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';

interface MainLayoutProps {
  user: User | null;
  children: React.ReactNode;
  currentModule: 'ai-table' | 'mailbox' | 'crm' | 'email-campaign';
  onModuleChange: (module: 'ai-table' | 'mailbox' | 'crm' | 'email-campaign') => void;
  onLogout: () => void;
  onCustomerView?: (customerId: string) => void;
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

// Mock customers for global search
const mockCustomers = [
  { id: '1', name: 'Sarah Johnson', company: 'TechCorp Inc.', email: 'sarah.johnson@techcorp.com' },
  { id: '2', name: 'Michael Chen', company: 'Innovate.io', email: 'michael.chen@innovate.io' },
  { id: '3', name: 'Emily Rodriguez', company: 'GlobalTech Solutions', email: 'emily.r@globaltech.com' }
];

export function MainLayout({ user, children, currentModule, onModuleChange, onLogout, onCustomerView }: MainLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof mockCustomers>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const getUserInitials = (user: User) => {
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = (user: User) => {
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  };

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = mockCustomers.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.company.toLowerCase().includes(query.toLowerCase()) ||
        customer.email.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    onModuleChange('crm');
    if (onCustomerView) {
      onCustomerView(customerId);
    }
  };

  const generateProfilePicture = (name: string) => {
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
  };

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

          {/* Global Search */}
          <div className="flex-1 max-w-md mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers, companies, deals..."
                value={searchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="pl-10 bg-muted/30"
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Customers</p>
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer"
                      onClick={() => handleCustomerSelect(customer.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={generateProfilePicture(customer.name)} alt={customer.name} />
                        <AvatarFallback className="text-xs">{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{customer.company}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        View 360
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={getUserDisplayName(user)} />
                      <AvatarFallback className="text-sm">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getUserDisplayName(user)}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 top-16 lg:top-0 lg:flex-shrink-0
        `}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Business Modules</h3>
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = currentModule === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start h-12 ${
                          isActive 
                            ? `${item.bgColor} ${item.color} border ${item.borderColor} hover:${item.bgColor}` 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          onModuleChange(item.id);
                          setSidebarOpen(false);
                        }}
                      >
                        <item.icon className={`h-5 w-5 mr-3 ${isActive ? item.color : 'text-muted-foreground'}`} />
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
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
                <div className="space-y-1">
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onModuleChange('crm')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Contact
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
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