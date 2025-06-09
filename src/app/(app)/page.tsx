"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSearchHistory, SavedSearchItem } from '@/features/search/components/SearchHistoryManager';
import { useToast } from '@/components/ui/toast';

export default function AppPage() {
  const { addToast } = useToast();
  const { fetchSavedSearches, saveCompleteSearch, deleteSavedSearch } = useSearchHistory();

  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  const fetchSearches = useCallback(async () => {
    const searches = await fetchSavedSearches();
    setSavedSearches(searches);
  }, [fetchSavedSearches]);

  useEffect(() => {
    fetchSearches();
    const localRecent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(localRecent);
  }, [fetchSearches]);

  const handleSavedSearchItemClick = (item: SavedSearchItem) => {
    setCurrentPrompt(item.query_text);
  };

  const handleRecentSearchItemClick = (query: string) => {
    setCurrentPrompt(query);
  };

  const handleSave = async () => {
    if (!window.__searchContainerApi) {
      addToast("Search API not available", "error");
      return;
    }
    const completeState = window.__searchContainerApi.getCompleteSearchState();
    if (!completeState || !completeState.query.trim()) {
      addToast("No search to save", "warning");
      return;
    }
    
    addToast("Saving search...", "info", 1000);
    const success = await saveCompleteSearch(completeState);
    if (success) {
      await fetchSearches();
      addToast(`Search "${completeState.query}" saved.`, "success");
    } else {
      addToast("Failed to save search.", "error");
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    setIsLoadingDelete(true);
    const success = await deleteSavedSearch(id);
    if (success) {
      await fetchSearches();
      addToast("Search deleted.", "success");
    } else {
      addToast("Failed to delete search.", "error");
    }
    setIsLoadingDelete(false);
  };

  return (
    <AppLayout
      recentSearches={recentSearches}
      savedSearches={savedSearches}
      setRecentSearches={setRecentSearches}
      currentPrompt={currentPrompt}
      setCurrentPrompt={setCurrentPrompt}
      isLoadingDelete={isLoadingDelete}
      handleSavedSearchItemClick={handleSavedSearchItemClick}
      handleRecentSearchItemClick={handleRecentSearchItemClick}
      handleDeleteSavedSearch={handleDeleteSavedSearch}
      handleSave={handleSave}
    />
  );
}
