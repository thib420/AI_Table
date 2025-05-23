"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/contexts/AuthContext';
import { supabase } from '@/shared/lib/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { CRMPage } from '@/modules/crm';
import { MailboxPage } from '@/modules/mailbox';
import { EmailCampaignPage } from '@/modules/campaigns';
import { LandingPage } from '@/modules/landing';
import { useSearchHistory, SavedSearchItem } from '@/modules/search/components/SearchHistoryManager';
import { ExaResultItem } from '@/shared/types/exa';

// Define the SearchContainerApi type
interface SearchContainerApi {
  handleSearchSubmit: (query: string) => void;
  loadSavedSearchResults: (results: ExaResultItem[]) => void;
  loadCompleteSavedSearch: (savedSearch: SavedSearchItem) => void;
  getResults: () => ExaResultItem[];
  getCompleteSearchState: () => import('@/modules/search/components/SearchHistoryManager').CompleteSearchState | null;
}

// Extend Window interface
declare global {
  interface Window {
    __searchContainerApi?: SearchContainerApi;
  }
}

type BusinessModule = 'ai-table' | 'mailbox' | 'crm' | 'email-campaign';

export default function AppPage() {
  const router = useRouter();
  const { user, session, isLoading: authIsLoading, signOut } = useAuth();
  const { fetchSavedSearches, saveCompleteSearch, deleteSavedSearch } = useSearchHistory();

  const [currentModule, setCurrentModule] = useState<BusinessModule>('ai-table');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Fetch saved searches when user changes
  const fetchSavedSearchesAndUpdate = useCallback(async () => {
    if (!user) {
      setSavedSearches([]);
      return;
    }
    try {
      const data = await fetchSavedSearches();
      setSavedSearches(data);
    } catch (err) {
      console.error("Error fetching saved searches:", err);
      setSavedSearches([]);
    }
  }, [user, fetchSavedSearches]);

  useEffect(() => {
    if (user) {
      fetchSavedSearchesAndUpdate();
    } else {
      setSavedSearches([]);
    }
  }, [user, fetchSavedSearchesAndUpdate]);

  useEffect(() => {
    if (!authIsLoading && !user) {
      // No redirect here as per previous logic, landing page is /landingpage
    }
  }, [user, authIsLoading, router]);

  useEffect(() => {
    if (session) {
      console.log("User session:", session);
    }
  }, [session]);

  // Authentication functions
  const handleLoginWithAzure = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: window.location.origin + '/'
      },
    });
    if (error) {
      console.error('Error logging in with Azure:', error.message);
      alert("Failed to login with Azure: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setRecentSearches([]);
    setCurrentModule('ai-table'); // Reset to default module
    router.push('/landingpage');
  };

  // Handle search history interactions - simplified
  const handleSavedSearchItemClick = (item: SavedSearchItem) => {
    setCurrentPrompt(item.query_text);
    // Switch to AI Table module when clicking on saved searches
    setCurrentModule('ai-table');
  };

  const handleRecentSearchItemClick = (query: string) => {
    setCurrentPrompt(query);
    // Switch to AI Table module when clicking on recent searches
    setCurrentModule('ai-table');
  };

  // Save function using the window API for backward compatibility
  const handleSave = async () => {
    if (!user || !currentPrompt.trim()) return;
    
    if (!window.__searchContainerApi) {
      console.error("SearchContainer API not available");
      return;
    }

    // Get complete search state from the AppLayout component
    const completeState = window.__searchContainerApi.getCompleteSearchState();
    
    if (completeState) {
      const success = await saveCompleteSearch(completeState);
      if (success) {
        fetchSavedSearchesAndUpdate();
      }
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    if (!user) return;
    setIsLoadingDelete(true);
    
    const success = await deleteSavedSearch(id);
    
    if (success) {
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    }
    
    setIsLoadingDelete(false);
  };

  const handleModuleChange = (module: BusinessModule) => {
    setCurrentModule(module);
    // Clear customer selection when switching modules (except to CRM)
    if (module !== 'crm') {
      setSelectedCustomerId(null);
    }
  };

  const handleCustomerView = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentModule('crm');
  };

  // Render the appropriate module content
  const renderModuleContent = () => {
    switch (currentModule) {
      case 'ai-table':
        return (
          <AppLayout
            user={user}
            authIsLoading={authIsLoading}
            recentSearches={recentSearches}
            savedSearches={savedSearches}
            setRecentSearches={setRecentSearches}
            setSavedSearches={setSavedSearches}
            currentPrompt={currentPrompt}
            setCurrentPrompt={setCurrentPrompt}
            isLoadingDelete={isLoadingDelete}
            handleSavedSearchItemClick={handleSavedSearchItemClick}
            handleRecentSearchItemClick={handleRecentSearchItemClick}
            handleLogout={handleLogout}
            handleDeleteSavedSearch={handleDeleteSavedSearch}
            handleSave={handleSave}
          />
        );
      case 'mailbox':
        return <MailboxPage onCustomerView={handleCustomerView} />;
      case 'crm':
        return <CRMPage selectedCustomerId={selectedCustomerId} onCustomerBack={() => setSelectedCustomerId(null)} />;
      case 'email-campaign':
        return <EmailCampaignPage onCustomerView={handleCustomerView} />;
      default:
        return (
          <AppLayout
            user={user}
            authIsLoading={authIsLoading}
            recentSearches={recentSearches}
            savedSearches={savedSearches}
            setRecentSearches={setRecentSearches}
            setSavedSearches={setSavedSearches}
            currentPrompt={currentPrompt}
            setCurrentPrompt={setCurrentPrompt}
            isLoadingDelete={isLoadingDelete}
            handleSavedSearchItemClick={handleSavedSearchItemClick}
            handleRecentSearchItemClick={handleRecentSearchItemClick}
            handleLogout={handleLogout}
            handleDeleteSavedSearch={handleDeleteSavedSearch}
            handleSave={handleSave}
          />
        );
    }
  };

  // Show landing page if user is not authenticated
  if (!authIsLoading && !user) {
    return <LandingPage onGetStarted={handleLoginWithAzure} />;
  }

  // Show main application with module navigation for authenticated users
  if (user) {
    return (
      <MainLayout
        user={user}
        currentModule={currentModule}
        onModuleChange={handleModuleChange}
        onLogout={handleLogout}
        onCustomerView={handleCustomerView}
      >
        {renderModuleContent()}
      </MainLayout>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
