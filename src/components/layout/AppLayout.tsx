"use client";

import React, { useState, useEffect } from 'react';
import { AppLayoutProps } from '@/shared/types/search';
import { useSearchState } from '@/shared/hooks/useSearchState';
import { useAIColumns } from '@/shared/hooks/useAIColumns';
import { SearchSidebar } from '@/components/layout/SearchSidebar';
import { SearchResults } from '@/components/layout/SearchResults';
import { CompleteSearchState } from '@/modules/search/components/SearchHistoryManager';

export function AppLayout({
  user,
  authIsLoading,
  recentSearches,
  savedSearches,
  setRecentSearches,
  currentPrompt,
  setCurrentPrompt,
  isLoadingDelete,
  handleSavedSearchItemClick,
  handleRecentSearchItemClick,
  handleLogout,
  handleDeleteSavedSearch,
  handleSave
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Use the custom hooks
  const {
    searchState,
    setSearchState,
    performSearch,
    loadMoreResults,
    loadSavedSearch,
    handleColumnFilterChange,
    handleColumnSortChange,
    clearAllFilters,
    handleRowSelection,
    deleteSelectedRows,
    getCompleteSearchState
  } = useSearchState(currentPrompt, setCurrentPrompt, recentSearches, setRecentSearches);

  const { addAIColumn, removeColumn, isCellProcessing } = useAIColumns(searchState, setSearchState);

  // Handle sidebar actions
  const handleSavedSearchClick = (savedSearch: any) => {
    handleSavedSearchItemClick(savedSearch);
    loadSavedSearch(savedSearch);
  };

  const handleRecentSearchClick = (query: string) => {
    handleRecentSearchItemClick(query);
    performSearch(query, 10);
  };

  const handleQueryChange = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  };

  const handleSearch = (query: string) => {
    performSearch(query, 10);
  };

  // Expose API for backward compatibility
  useEffect(() => {
    window.__searchContainerApi = {
      handleSearchSubmit: (query: string) => {
        performSearch(query);
      },
      loadSavedSearchResults: (results: any[]) => {
        setSearchState(prev => ({
          ...prev,
          results,
          enrichedResults: results.map(item => ({
            ...item,
            cleanPosition: item.title || 'N/A',
            extractedCompany: 'N/A'
          })),
          currentResultCount: results.length,
          isLoadingMore: false,
          selectedRows: new Set()
        }));
      },
      loadCompleteSavedSearch: (savedSearch: any) => {
        loadSavedSearch(savedSearch);
      },
      getResults: () => searchState.results,
      getCompleteSearchState: (): CompleteSearchState | null => {
        return getCompleteSearchState();
      }
    };

    return () => {
      delete window.__searchContainerApi;
    };
  }, [searchState, performSearch, loadSavedSearch, setSearchState, getCompleteSearchState]);

  // Early returns after all hooks are defined
  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <SearchSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          savedSearches={savedSearches}
          recentSearches={recentSearches}
          isLoadingDelete={isLoadingDelete}
          onSavedSearchClick={handleSavedSearchClick}
          onRecentSearchClick={handleRecentSearchClick}
          onDeleteSavedSearch={handleDeleteSavedSearch}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden min-h-0 w-full">
          <div className="h-full w-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 pb-8">
              <SearchResults
                searchState={searchState}
                onColumnFilterChange={handleColumnFilterChange}
                onColumnSortChange={handleColumnSortChange}
                onClearAllFilters={clearAllFilters}
                onDeleteSelectedRows={deleteSelectedRows}
                onAddAIColumn={addAIColumn}
                onLoadMoreResults={loadMoreResults}
                onSave={handleSave}
                onRowSelection={handleRowSelection}
                isAddingAIColumn={searchState.isAddingAIColumn}
                selectedRowsCount={searchState.selectedRows.size}
              />
            </div>


          </div>
        </main>
      </div>
    </div>
  );
} 