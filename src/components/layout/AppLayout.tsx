"use client";

import React, { useState, useEffect } from 'react';
import { AppLayoutProps } from '@/types/search';
import { useSearchState } from '@/features/search/hooks/useSearchState';
import { useAIColumns } from '@/features/search/hooks/useAIColumns';
import { SearchSidebar } from '@/features/search/components/SearchSidebar';
import { SearchResults } from '@/features/search/components/SearchResults';
import { SearchInput } from '@/features/search/components/SearchInput';
import { CompleteSearchState } from '@/features/search/components/SearchHistoryManager';

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
  const [isSearchInputVisible, setIsSearchInputVisible] = useState(true);

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
    handleSelectProfile,
    getCompleteSearchState
  } = useSearchState(currentPrompt, setCurrentPrompt, recentSearches, setRecentSearches);

  const { addAIColumn, removeColumn, isCellProcessing } = useAIColumns(searchState, setSearchState);

  // Handle sidebar actions
  const handleSavedSearchClick = (savedSearch: any) => {
    handleSavedSearchItemClick(savedSearch);
    loadSavedSearch(savedSearch);
    setIsSearchInputVisible(false);
  };

  const handleRecentSearchClick = (query: string) => {
    handleRecentSearchItemClick(query);
    performSearch(query, 10);
    setIsSearchInputVisible(false);
  };

  const handleQueryChange = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  };

  const handleSearch = (query: string) => {
    performSearch(query, 10);
    setIsSearchInputVisible(false);
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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Black Lateral Sidebar */}
      <div className="w-64 bg-black text-white flex-shrink-0 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold">AI Table</h2>
          <p className="text-gray-400 text-sm mt-1">Professional Search</p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {/* New Search Button */}
          <div className="p-4">
            <button
              onClick={() => {
                setSearchState(prev => ({
                  ...prev,
                  query: '',
                  results: [],
                  enrichedResults: [],
                  sortedResults: [],
                  filteredResults: [],
                  error: null,
                  selectedRows: new Set(),
                  columns: prev.columns.filter(c => c.type === 'default'),
                  columnFilters: [],
                  columnSort: null,
                }));
                setCurrentPrompt('');
                setIsSearchInputVisible(true);
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              + New Search
            </button>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Recent</h3>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-xl transition-colors truncate"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Saved</h3>
              <div className="space-y-1">
                {savedSearches.slice(0, 5).map((savedSearch) => (
                  <div key={savedSearch.id} className="group relative">
                    <button
                      onClick={() => handleSavedSearchClick(savedSearch)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-xl transition-colors truncate pr-8"
                    >
                      {savedSearch.query_text}
                    </button>
                    <button
                      onClick={() => handleDeleteSavedSearch(savedSearch.id)}
                      disabled={isLoadingDelete}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-background rounded-l-2xl">
        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full flex flex-col">
            {/* Results Area - Takes up available space minus input */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
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
                onProfileSelect={handleSelectProfile}
                isAddingAIColumn={searchState.isAddingAIColumn}
                selectedRowsCount={searchState.selectedRows.size}
              />
            </div>
          </div>
        </main>

        {/* Fixed Search Input at Bottom */}
        {isSearchInputVisible && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-background/0 pt-8 pb-6">
            <div className="w-full max-w-2xl mx-auto px-6">
              <SearchInput
                query={searchState.query}
                isLoading={searchState.isLoading}
                sidebarOpen={false}
                setSidebarOpen={() => {}}
                onQueryChange={handleQueryChange}
                onSearch={handleSearch}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 