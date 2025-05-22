"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { useSearchHistory, SavedSearchItem } from '@/components/SearchHistoryManager';
import { ExaResultItem } from '@/types/exa';

// Define the SearchContainerApi type
interface SearchContainerApi {
  handleSearchSubmit: (query: string) => void;
  loadSavedSearchResults: (results: ExaResultItem[]) => void;
  loadCompleteSavedSearch: (savedSearch: SavedSearchItem) => void;
  getResults: () => ExaResultItem[];
  getCompleteSearchState: () => import('@/components/SearchHistoryManager').CompleteSearchState | null;
}

// Extend Window interface
declare global {
  interface Window {
    __searchContainerApi?: SearchContainerApi;
  }
}

export default function AppPage() {
  const router = useRouter();
  const { user, session, isLoading: authIsLoading, signOut } = useAuth();
  const { fetchSavedSearches, saveCompleteSearch, deleteSavedSearch } = useSearchHistory();

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

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
      console.error("Error in fetchSavedSearchesAndUpdate:", err);
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
    router.push('/landingpage');
  };

  // Handle search history interactions - simplified
  const handleSavedSearchItemClick = (item: SavedSearchItem) => {
    setCurrentPrompt(item.query_text);
  };

  const handleRecentSearchItemClick = (query: string) => {
    setCurrentPrompt(query);
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
      handleLoginWithAzure={handleLoginWithAzure}
      handleLogout={handleLogout}
      handleDeleteSavedSearch={handleDeleteSavedSearch}
      handleSave={handleSave}
    />
  );
}
