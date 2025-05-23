"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedAuth } from '@/shared/contexts/UnifiedAuthContext';
import { supabase } from '@/shared/lib/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { CRMPage } from '@/modules/crm';
import { MailboxPage } from '@/modules/mailbox';
import { EmailCampaignPage } from '@/modules/campaigns';
import { LandingPage } from '@/modules/landing';
import { useSearchHistory, SavedSearchItem } from '@/modules/search/components/SearchHistoryManager';
import { ExaResultItem } from '@/shared/types/exa';
import { useToast } from '@/components/ui/toast';

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
  const { addToast } = useToast();
  const { 
    user, 
    session, 
    isLoading: authIsLoading, 
    signOut,
    hasAnyAuth,
    isMicrosoftSignedIn,
    signInToMicrosoft 
  } = useUnifiedAuth();
  const { fetchSavedSearches, saveCompleteSearch, deleteSavedSearch } = useSearchHistory();

  const [currentModule, setCurrentModule] = useState<BusinessModule>('ai-table');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Fetch saved searches from database or localStorage
  const fetchSavedSearchesAndUpdate = useCallback(async () => {
    try {
      if (!user) {
        // Load from localStorage for development mode
        const localSearches = JSON.parse(localStorage.getItem('ai_table_saved_searches') || '[]');
        setSavedSearches(localSearches);
        return;
      }
      
      // Load from database for authenticated users
      const data = await fetchSavedSearches();
      setSavedSearches(data);
    } catch (err) {
      console.error("Error fetching saved searches:", err);
      setSavedSearches([]);
    }
  }, [user, fetchSavedSearches]);

  useEffect(() => {
    // Always fetch saved searches (from DB or localStorage)
    fetchSavedSearchesAndUpdate();
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
    // Try Microsoft sign-in first for unified experience
    try {
      await signInToMicrosoft();
    } catch (error) {
      console.error('Error signing in with Microsoft:', error);
      // Fallback to Supabase Azure OAuth if Microsoft fails
      const { error: supabaseError } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: window.location.origin + '/'
        },
      });
      if (supabaseError) {
        console.error('Error logging in with Azure via Supabase:', supabaseError.message);
        alert("Failed to login with Azure: " + supabaseError.message);
      }
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

  // Save function with improved error handling and development support
  const handleSave = async () => {
    if (!currentPrompt.trim()) {
      addToast("No search query to save", "warning");
      return;
    }
    
    if (!window.__searchContainerApi) {
      console.error("SearchContainer API not available");
      addToast("Unable to save: Search API not available", "error");
      return;
    }

    // Get complete search state from the AppLayout component
    const completeState = window.__searchContainerApi.getCompleteSearchState();
    
    if (!completeState) {
      addToast("No search results to save. Please perform a search first.", "warning");
      return;
    }

    try {
      addToast("Saving search...", "info", 1000);
      
      // For development mode, save to localStorage if no user
      if (!user) {
        const savedSearches = JSON.parse(localStorage.getItem('ai_table_saved_searches') || '[]');
        const newSearch = {
          id: `local_${Date.now()}`,
          query_text: completeState.query,
          saved_at: new Date().toISOString(),
          search_results_data: completeState.originalResults,
          enriched_results_data: completeState.enrichedResults,
          column_configuration: completeState.columnConfiguration,
          user_id: 'development_user'
        };
        
        savedSearches.unshift(newSearch);
        // Keep only last 10 searches in localStorage
        localStorage.setItem('ai_table_saved_searches', JSON.stringify(savedSearches.slice(0, 10)));
        setSavedSearches(savedSearches.slice(0, 10));
        
        addToast(`Search "${completeState.query}" saved successfully!`, "success");
        return;
      }

      // For authenticated users, save to database
      const success = await saveCompleteSearch(completeState);
      if (success) {
        await fetchSavedSearchesAndUpdate();
        addToast(`Search "${completeState.query}" saved successfully!`, "success");
      } else {
        addToast("Failed to save search. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error saving search:", error);
      addToast("Error saving search. Please try again.", "error");
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    setIsLoadingDelete(true);
    
    try {
      if (!user) {
        // Delete from localStorage for development mode
        const savedSearches = JSON.parse(localStorage.getItem('ai_table_saved_searches') || '[]');
        const updatedSearches = savedSearches.filter((s: SavedSearchItem) => s.id !== id);
        localStorage.setItem('ai_table_saved_searches', JSON.stringify(updatedSearches));
        setSavedSearches(updatedSearches);
        setIsLoadingDelete(false);
        return;
      }
      
      // Delete from database for authenticated users
      const success = await deleteSavedSearch(id);
      
      if (success) {
        setSavedSearches(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting saved search:", error);
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

  // Show landing page if user is not authenticated (no Supabase user AND no Microsoft auth)
  if (!authIsLoading && !hasAnyAuth) {
    return <LandingPage onGetStarted={handleLoginWithAzure} />;
  }

  // Show main application with module navigation for authenticated users OR development bypass
  if (hasAnyAuth || true) { // Temporarily allow access without authentication
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

  // Loading state - add timeout protection
  if (authIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Click here if loading takes too long
          </button>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return <LandingPage onGetStarted={handleLoginWithAzure} />;
}
