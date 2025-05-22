"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Search, Plus, Trash2, Menu, Moon, Sun, User as UserIcon, LogOut, History, Bookmark, Settings, Send, ChevronDown, X, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SavedSearchItem, CompleteSearchState } from '@/components/SearchHistoryManager';
import { ExaResultItem } from '@/types/exa';
import { AIColumnGenerator, ColumnDef, EnrichedExaResultItem, AIColumnConfig } from '@/lib/ai-column-generator';
import { useTheme } from 'next-themes';

interface SearchState {
  query: string;
  isLoading: boolean;
  results: ExaResultItem[];
  enrichedResults: EnrichedExaResultItem[];
  columns: ColumnDef[];
  error: string | null;
  aiProcessing: {
    [resultIndex: number]: {
      [columnId: string]: boolean;
    };
  };
  isAddingAIColumn: boolean;
  currentResultCount: number;
  isLoadingMore: boolean;
  selectedRows: Set<number>;
}

interface AppLayoutProps {
  user: User | null;
  authIsLoading: boolean;
  recentSearches: string[];
  savedSearches: SavedSearchItem[];
  setRecentSearches: (searches: string[]) => void;
  setSavedSearches: (searches: SavedSearchItem[]) => void;
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  isLoadingDelete: boolean;
  handleSavedSearchItemClick: (item: SavedSearchItem) => void;
  handleRecentSearchItemClick: (query: string) => void;
  handleLoginWithAzure: () => void;
  handleLogout: () => void;
  handleDeleteSavedSearch: (id: string) => void;
  handleSave: () => void;
}

const defaultColumns: ColumnDef[] = [
  { id: 'author', header: 'Author', accessorKey: 'author', type: 'default' },
  { id: 'title', header: 'Position', accessorKey: 'cleanPosition', type: 'default' },
  { id: 'url', header: 'LinkedIn', accessorKey: 'url', type: 'default' },
  { id: 'company', header: 'Company', accessorKey: 'extractedCompany', type: 'default' },
];

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
  handleLoginWithAzure,
  handleLogout,
  handleDeleteSavedSearch,
  handleSave
}: AppLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isLoading: false,
    results: [],
    enrichedResults: [],
    columns: defaultColumns,
    error: null,
    aiProcessing: {},
    isAddingAIColumn: false,
    currentResultCount: 10,
    isLoadingMore: false,
    selectedRows: new Set()
  });

  // Update search query when currentPrompt changes
  useEffect(() => {
    setSearchState(prev => ({ ...prev, query: currentPrompt }));
  }, [currentPrompt]);

    const performSearch = useCallback(async (query: string, numResults: number = 10) => {
    if (!query.trim()) return;

    setSearchState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      query: query.trim(),
      aiProcessing: {} // Reset AI processing state
    }));

    try {
      const response = await fetch(`/api/exa?query=${encodeURIComponent(query.trim())}&numResults=${numResults}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      // Handle different response formats
      const results = data.results || data.data?.results || [];
      
      setSearchState(prev => ({
        ...prev,
        results,
        enrichedResults: results.map((item: ExaResultItem) => processLinkedInData(item)),
        columns: defaultColumns, // Reset to default columns for new searches
        isLoading: false,
        aiProcessing: {}, // Reset AI processing state
        isAddingAIColumn: false,
        currentResultCount: numResults,
        isLoadingMore: false,
        selectedRows: new Set()
      }));

      // Add to recent searches
      setRecentSearches([query, ...recentSearches.filter(s => s !== query)].slice(0, 10));
      setCurrentPrompt(query);

    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
        aiProcessing: {}, // Reset AI processing state
        isAddingAIColumn: false,
        isLoadingMore: false,
        selectedRows: new Set()
      }));
    }
  }, [recentSearches, setRecentSearches, setCurrentPrompt]);

  const loadMoreResults = useCallback(async () => {
    if (!searchState.query || searchState.isLoadingMore) return;

    const newResultCount = Math.min(searchState.currentResultCount + 10, 100); // Max 100 results
    
    setSearchState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const response = await fetch(`/api/exa?query=${encodeURIComponent(searchState.query)}&numResults=${newResultCount}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load more results');
      }

      const results = data.results || data.data?.results || [];
      
      setSearchState(prev => ({
        ...prev,
        results,
        enrichedResults: results.map((item: ExaResultItem) => processLinkedInData(item)),
        currentResultCount: newResultCount,
        isLoadingMore: false
      }));

    } catch (error) {
      console.error('Load more error:', error);
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load more results',
        isLoadingMore: false
      }));
    }
  }, [searchState.query, searchState.currentResultCount, searchState.isLoadingMore]);

  const addAIColumn = useCallback(async (columnName: string, prompt: string) => {
    const config: AIColumnConfig = {
      columnName,
      prompt,
      maxResponseLength: 50,
      temperature: 0.7,
      includeProfileContext: true
    };

    // Validate configuration
    const validation = AIColumnGenerator.validateConfig(config);
    if (!validation.isValid) {
      console.error('Invalid AI column configuration:', validation.errors);
      return;
    }

    // Create the new column
    const newColumn = AIColumnGenerator.createColumnDefinition(config);

    // Add column to state immediately for UI feedback
    setSearchState(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn],
      isAddingAIColumn: true
    }));

    // Initialize loading states for all cells in this column
    if (searchState.results.length > 0) {
      setSearchState(prev => ({
        ...prev,
        aiProcessing: {
          ...prev.aiProcessing,
          ...Object.fromEntries(
            prev.enrichedResults.map((_, index) => [
              index,
              { ...prev.aiProcessing[index], [newColumn.id]: true }
            ])
          )
        }
      }));

      try {
        // Process each result individually with visual feedback
        const enrichedResults = [...searchState.enrichedResults];
        
        for (let i = 0; i < enrichedResults.length; i++) {
          try {
            const enrichedResult = await AIColumnGenerator.enrichSingleResult(
              enrichedResults[i],
              newColumn,
              config
            );
            
            // Update the specific result
            enrichedResults[i] = enrichedResult;
            
            // Update state with the new result and remove loading for this cell
            setSearchState(prev => ({
              ...prev,
              enrichedResults: [...enrichedResults],
              aiProcessing: {
                ...prev.aiProcessing,
                [i]: {
                  ...prev.aiProcessing[i],
                  [newColumn.id]: false
                }
              }
            }));
            
                      // Small delay to make the animation visible
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error enriching result ${i}:`, error);
          // Remove loading state even on error
          setSearchState(prev => ({
            ...prev,
            aiProcessing: {
              ...prev.aiProcessing,
              [i]: {
                ...prev.aiProcessing[i],
                [newColumn.id]: false
              }
            }
          }));
        }
      }
      
      // Mark AI column addition as complete
      setSearchState(prev => ({
        ...prev,
        isAddingAIColumn: false
      }));
      } catch (error) {
        console.error('AI enrichment error:', error);
        // Remove the column if enrichment failed
        setSearchState(prev => ({
          ...prev,
          columns: prev.columns.filter(col => col.id !== newColumn.id),
          aiProcessing: Object.fromEntries(
            Object.entries(prev.aiProcessing).map(([key, value]) => [
              key,
              Object.fromEntries(
                Object.entries(value).filter(([colId]) => colId !== newColumn.id)
              )
            ])
          ),
          isAddingAIColumn: false
        }));
      }
    }
  }, [searchState.results, searchState.enrichedResults]);

  const loadSavedSearch = useCallback((savedSearch: SavedSearchItem) => {
    if (savedSearch.enriched_results_data && savedSearch.column_configuration) {
      // Load complete saved search
      setSearchState({
        query: savedSearch.query_text,
        isLoading: false,
        results: savedSearch.search_results_data || [],
        enrichedResults: savedSearch.enriched_results_data,
        columns: savedSearch.column_configuration,
        error: null,
        aiProcessing: {},
        isAddingAIColumn: false,
        currentResultCount: savedSearch.search_results_data?.length || 0,
        isLoadingMore: false,
        selectedRows: new Set()
      });
    } else if (savedSearch.search_results_data) {
      // Load basic saved search
      setSearchState({
        query: savedSearch.query_text,
        isLoading: false,
        results: savedSearch.search_results_data,
        enrichedResults: savedSearch.search_results_data.map(item => processLinkedInData(item)),
        columns: defaultColumns,
        error: null,
        aiProcessing: {},
        isAddingAIColumn: false,
        currentResultCount: savedSearch.search_results_data.length,
        isLoadingMore: false,
        selectedRows: new Set()
      });
    } else {
      // Fallback: perform new search
      performSearch(savedSearch.query_text);
    }
    setCurrentPrompt(savedSearch.query_text);
  }, [performSearch, setCurrentPrompt]);

  // Expose API for backward compatibility
  useEffect(() => {
    window.__searchContainerApi = {
      handleSearchSubmit: (query: string) => {
        performSearch(query);
      },
      loadSavedSearchResults: (results: ExaResultItem[]) => {
        setSearchState(prev => ({
          ...prev,
          results,
          enrichedResults: results.map(item => processLinkedInData(item)),
          columns: defaultColumns,
          aiProcessing: {},
          isAddingAIColumn: false,
          currentResultCount: results.length,
          isLoadingMore: false,
          selectedRows: new Set()
        }));
      },
      loadCompleteSavedSearch: (savedSearch: SavedSearchItem) => {
        loadSavedSearch(savedSearch);
      },
      getResults: () => searchState.results,
      getCompleteSearchState: (): CompleteSearchState | null => {
        if (!searchState.query || searchState.results.length === 0) return null;
        return {
          query: searchState.query,
          originalResults: searchState.results,
          enrichedResults: searchState.enrichedResults,
          columnConfiguration: searchState.columns
        };
      }
    };

    return () => {
      delete window.__searchContainerApi;
    };
  }, [searchState, performSearch, loadSavedSearch]);

  if (authIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to AI Table</CardTitle>
            <CardDescription className="text-base">
              AI-powered search and analysis tool for professional profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleLoginWithAzure} className="w-full" size="lg">
              <UserIcon className="mr-2 h-4 w-4" />
              Login with Azure
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Function to generate a profile picture URL using a service like UI Avatars
  const generateProfilePicture = (authorName: string) => {
    if (!authorName || authorName === 'N/A') return null;
    
    // Use UI Avatars service to generate a nice profile picture
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = authorName.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
  };

  // Helper function to check if a cell is being processed
  const isCellProcessing = (resultIndex: number, columnId: string): boolean => {
    return searchState.aiProcessing[resultIndex]?.[columnId] || false;
  };

  // Row selection functions
  const toggleRowSelection = useCallback((index: number) => {
    setSearchState(prev => {
      const newSelectedRows = new Set(prev.selectedRows);
      if (newSelectedRows.has(index)) {
        newSelectedRows.delete(index);
      } else {
        newSelectedRows.add(index);
      }
      return { ...prev, selectedRows: newSelectedRows };
    });
  }, []);

  const toggleAllRows = useCallback(() => {
    setSearchState(prev => {
      const allSelected = prev.selectedRows.size === prev.enrichedResults.length;
      const newSelectedRows = allSelected 
        ? new Set<number>() 
        : new Set(prev.enrichedResults.map((_, index) => index));
      return { ...prev, selectedRows: newSelectedRows };
    });
  }, []);

  const deleteSelectedRows = useCallback(() => {
    setSearchState(prev => {
      const indicesToDelete = Array.from(prev.selectedRows).sort((a, b) => b - a);
      let newResults = [...prev.results];
      let newEnrichedResults = [...prev.enrichedResults];
      
      // Remove rows in reverse order to maintain correct indices
      indicesToDelete.forEach(index => {
        newResults.splice(index, 1);
        newEnrichedResults.splice(index, 1);
      });

      return {
        ...prev,
        results: newResults,
        enrichedResults: newEnrichedResults,
        selectedRows: new Set()
      };
    });
  }, []);

  // Function to extract clean position and company from LinkedIn title
  const processLinkedInData = (result: ExaResultItem): EnrichedExaResultItem => {
    const title = result.title || '';
    
    // Extract position (everything before " at " or " bei " or " - ")
    let position = title;
    let company = 'N/A';
    
    // Common patterns in LinkedIn titles
    const patterns = [
      / at (.+?)(?:\s*\||\s*$)/i,  // "Position at Company | ..."
      / bei (.+?)(?:\s*\||\s*$)/i, // "Position bei Company | ..." (German)
      / - (.+?)(?:\s*\||\s*$)/i,   // "Position - Company | ..."
      / @ (.+?)(?:\s*\||\s*$)/i,   // "Position @ Company | ..."
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        // Extract position (everything before the pattern)
        position = title.substring(0, match.index).trim();
        // Extract company
        company = match[1].trim();
        break;
      }
    }
    
    // Clean up position - remove common prefixes/suffixes
    position = position
      .replace(/^(.*?)\s*-\s*/, '') // Remove "Name - " prefix
      .replace(/\s*-\s*.*$/, '')    // Remove " - ..." suffix
      .trim();
    
    // If no pattern matched, try to extract from author name
    if (company === 'N/A' && result.author) {
      const authorPattern = new RegExp(`^${result.author}\\s*-\\s*(.+?)\\s*(?:at|bei|@)\\s*(.+?)(?:\\s*\\||$)`, 'i');
      const authorMatch = title.match(authorPattern);
      if (authorMatch) {
        position = authorMatch[1].trim();
        company = authorMatch[2].trim();
      }
    }
    
    // Fallback: if position is still the full title, try to clean it
    if (position === title && result.author) {
      position = title.replace(new RegExp(`^${result.author}\\s*-\\s*`, 'i'), '').trim();
    }
    
    return {
      ...result,
      cleanPosition: position,
      extractedCompany: company
    };
  };

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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Search className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">AI Table</h1>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
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
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 top-16 lg:top-0 lg:flex-shrink-0
        `}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Saved Searches */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Saved Searches</h3>
                  <Badge variant="secondary" className="text-xs">
                    {savedSearches.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {savedSearches.length === 0 ? (
                    <div className="text-center py-6">
                      <Bookmark className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No saved searches yet</p>
                      <p className="text-xs text-muted-foreground">Save your searches to access them later</p>
                    </div>
                  ) : (
                    savedSearches.map((search) => (
                      <div key={search.id} className="group relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50"
                          onClick={() => {
                            handleSavedSearchItemClick(search);
                            loadSavedSearch(search);
                            setSidebarOpen(false);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{search.query_text}</p>
                                                         <p className="text-xs text-muted-foreground">
                               {new Date(search.saved_at).toLocaleDateString()}
                             </p>
                          </div>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteSavedSearch(search.id)}
                          disabled={isLoadingDelete}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Recent Searches */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Recent Searches</h3>
                  <Badge variant="secondary" className="text-xs">
                    {recentSearches.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {recentSearches.length === 0 ? (
                    <div className="text-center py-6">
                      <History className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No recent searches</p>
                    </div>
                  ) : (
                    recentSearches.slice(0, 8).map((search, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50"
                        onClick={() => {
                          handleRecentSearchItemClick(search);
                          performSearch(search, 10);
                          setSidebarOpen(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{search}</p>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden min-h-0">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">

            {/* Error Display */}
            {searchState.error && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <p className="text-sm text-destructive font-medium">{searchState.error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {searchState.results.length > 0 && (
              <Card className="flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Search Results</CardTitle>
                    <CardDescription>
                      Found <span className="font-medium text-foreground">{searchState.results.length}</span> results for <span className="font-medium text-foreground">&quot;{searchState.query}&quot;</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {searchState.selectedRows.size > 0 && (
                      <Button
                        onClick={deleteSelectedRows}
                        variant="destructive"
                        size="sm"
                        className="mr-2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({searchState.selectedRows.size})
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          disabled={searchState.isAddingAIColumn}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500 hover:from-purple-600 hover:via-violet-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-violet-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          {searchState.isAddingAIColumn ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 relative z-10" />
                              <span className="relative z-10">Processing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2 relative z-10" />
                              <span className="relative z-10">AI Columns</span>
                              <ChevronDown className="h-4 w-4 ml-2 relative z-10" />
                            </>
                          )}
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
                        <DropdownMenuLabel className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <span>AI Column Manager</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {/* Quick Add Presets */}
                        <div className="p-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Quick Add Columns</p>
                          {AIColumnGenerator.getSuggestedPrompts().map((category) => (
                            <div key={category.category} className="mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">{category.category}</p>
                              {category.prompts.map((preset) => (
                                <DropdownMenuItem
                                  key={preset.name}
                                  onClick={() => addAIColumn(preset.name, preset.prompt)}
                                  className="text-sm py-2 cursor-pointer"
                                >
                                  <Plus className="h-3 w-3 mr-2 text-green-500" />
                                  {preset.name}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          ))}
                        </div>

                        <DropdownMenuSeparator />

                        {/* Custom Column */}
                        <DropdownMenuItem
                          onClick={() => {
                            const columnName = prompt('Enter column name:');
                            const columnPrompt = prompt('Enter AI prompt for this column:');
                            if (columnName && columnPrompt) {
                              addAIColumn(columnName, columnPrompt);
                            }
                          }}
                          className="text-sm py-2 cursor-pointer"
                        >
                          <Plus className="h-3 w-3 mr-2 text-blue-500" />
                          Add Custom Column
                        </DropdownMenuItem>

                        {/* Existing AI Columns Management */}
                        {searchState.columns.filter(col => col.type === 'ai-generated').length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Manage Existing Columns</p>
                              {searchState.columns
                                .filter(col => col.type === 'ai-generated')
                                .map((column) => (
                                  <div key={column.id} className="flex items-center justify-between py-1">
                                    <span className="text-sm truncate flex-1">{column.header}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSearchState(prev => ({
                                          ...prev,
                                          columns: prev.columns.filter(col => col.id !== column.id),
                                          enrichedResults: prev.enrichedResults.map(result => {
                                            const { [column.accessorKey || '']: removed, ...rest } = result;
                                            return rest as EnrichedExaResultItem;
                                          })
                                        }));
                                      }}
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {searchState.results.length > 0 && (
                      <Button onClick={handleSave} variant="default" size="sm">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save Search
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border rounded-lg mx-6 mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="p-4 text-left font-medium text-muted-foreground w-12">
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={searchState.selectedRows.size === searchState.enrichedResults.length && searchState.enrichedResults.length > 0}
                                  onChange={toggleAllRows}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </div>
                            </th>
                            {searchState.columns.map((column) => (
                              <th key={column.id} className="p-4 text-left font-medium text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                  <span>{column.header}</span>
                                  {column.type === 'ai-generated' && (
                                    <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                                      <div className="flex items-center space-x-1">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                                        <span>AI</span>
                                      </div>
                                    </Badge>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {searchState.enrichedResults.map((result, index) => (
                            <tr key={result.id || index} className={`border-b hover:bg-muted/30 transition-colors ${searchState.selectedRows.has(index) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                              <td className="p-4 w-12">
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={searchState.selectedRows.has(index)}
                                    onChange={() => toggleRowSelection(index)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                </div>
                              </td>
                              {searchState.columns.map((column) => (
                                <td key={column.id} className="p-4 relative">
                                  {isCellProcessing(index, column.id) ? (
                                    // Loading animation for AI processing
                                    <div className="flex items-center space-x-2">
                                      <div className="animate-pulse flex space-x-2 items-center w-full">
                                        <div className="h-4 bg-gradient-to-r from-purple-200 via-violet-200 to-blue-200 dark:from-purple-800 dark:via-violet-800 dark:to-blue-800 rounded animate-shimmer bg-[length:200%_100%] flex-1 max-w-24"></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                      </div>
                                    </div>
                                  ) : (
                                    // Regular cell content
                                    column.accessorKey ? (
                                      column.accessorKey === 'url' ? (
                                        <a 
                                          href={result[column.accessorKey]} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline truncate block max-w-xs font-medium transition-colors"
                                        >
                                          {String(result[column.accessorKey])}
                                        </a>
                                      ) : column.accessorKey === 'author' ? (
                                        <div className="flex items-center space-x-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage 
                                              src={generateProfilePicture(String(result[column.accessorKey] || '')) || undefined}
                                              alt={String(result[column.accessorKey] || 'Profile')}
                                            />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary border">
                                              {String(result[column.accessorKey] || 'U').split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate block max-w-xs">
                                            {String(result[column.accessorKey] || 'N/A')}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className={`truncate block max-w-xs ${column.type === 'ai-generated' ? 'font-medium text-purple-700 dark:text-purple-300' : ''}`}>
                                          {String(result[column.accessorKey] || 'N/A')}
                                        </span>
                                      )
                                    ) : (
                                      'N/A'
                                    )
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
                {/* Load More Results Button */}
                {searchState.results.length > 0 && searchState.currentResultCount < 100 && (
                  <div className="px-6 pb-6">
                    <Button
                      onClick={loadMoreResults}
                      disabled={searchState.isLoadingMore}
                      variant="outline"
                      className="w-full"
                    >
                      {searchState.isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Loading more results...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Load More Results ({searchState.currentResultCount + 10 > 100 ? 100 - searchState.currentResultCount : 10} more)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Empty State */}
            {!searchState.isLoading && searchState.results.length === 0 && !searchState.error && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Search className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold">AI Table</h2>
                  <p className="text-muted-foreground text-lg max-w-md">
                    Search for professional profiles and analyze them with AI-powered insights
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-6 max-w-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Example searches:</span><br />
                    • &quot;Software engineers in San Francisco&quot;<br />
                    • &quot;Marketing directors at tech companies&quot;<br />
                    • &quot;Product managers in Paris&quot;
                  </p>
                </div>
              </div>
            )}

                        {/* Loading State */}
            {searchState.isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Searching...</h3>
                  <p className="text-sm text-muted-foreground">
                    Finding professional profiles for &quot;{searchState.query}&quot;
                  </p>
                </div>
              </div>
            )}
            </div>

            {/* Search Input at Bottom - ChatGPT Style */}
            <div className="bg-background p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex space-x-3 items-start">
                  <div className="relative flex-1">
                    <Textarea
                      placeholder="Search for professional profiles... (Shift + Enter for new line)"
                      value={searchState.query}
                      onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          performSearch(searchState.query, 10);
                        }
                      }}
                      className="pr-12 py-3 text-base resize-none"
                      rows={3}
                      disabled={searchState.isLoading}
                    />
                    <Button 
                      onClick={() => performSearch(searchState.query, 10)}
                      disabled={searchState.isLoading || !searchState.query.trim()}
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    >
                      {searchState.isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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