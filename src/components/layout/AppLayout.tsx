"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Search, Plus, Trash2, Menu, Moon, Sun, LogOut, History, Bookmark, Settings, Send, ChevronDown, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SavedSearchItem, CompleteSearchState } from '@/modules/search/components/SearchHistoryManager';
import { ExaResultItem } from '@/shared/types/exa';
import { AIColumnGenerator, ColumnDef, EnrichedExaResultItem, AIColumnConfig } from '@/modules/search/services/ai-column-generator';
import { ResultsTable } from '@/modules/search/components/ResultsTable';
import { ColumnFilterComponent, ColumnFilter } from '@/components/common/ColumnFilter';
import { ColumnSortIndicator, ColumnSort, sortData } from '@/components/common/ColumnSort';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/toast';

interface SearchState {
  query: string;
  isLoading: boolean;
  results: ExaResultItem[];
  enrichedResults: EnrichedExaResultItem[];
  filteredResults: EnrichedExaResultItem[];
  sortedResults: EnrichedExaResultItem[];
  columns: ColumnDef[];
  columnFilters: ColumnFilter[];
  columnSort: ColumnSort | null;
  error: string | null;
  aiProcessing: {
    [resultIndex: number]: {
      [columnId: string]: boolean;
    };
  };
  isAddingAIColumn: boolean;
  isEnhancingWithAI: boolean;
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
  handleLogout,
  handleDeleteSavedSearch,
  handleSave
}: AppLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isLoading: false,
    results: [],
    enrichedResults: [],
    filteredResults: [],
    sortedResults: [],
    columns: defaultColumns,
    columnFilters: [],
    columnSort: null,
    error: null,
    aiProcessing: {},
    isAddingAIColumn: false,
    isEnhancingWithAI: false,
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
      
      const enrichedData = results.map((item: ExaResultItem) => processLinkedInData(item));
      
      // Set initial state with basic data
      setSearchState(prev => ({
        ...prev,
        results,
        enrichedResults: enrichedData,
        filteredResults: enrichedData,
        sortedResults: enrichedData,
        columns: defaultColumns,
        columnFilters: [],
        columnSort: null,
        isLoading: false,
        aiProcessing: {},
        isAddingAIColumn: false,
        currentResultCount: numResults,
        isLoadingMore: false,
        selectedRows: new Set()
      }));

      // Enhance data with Gemini AI in the background
      setSearchState(prev => ({ ...prev, isEnhancingWithAI: true }));
      enhanceWithGemini(enrichedData).then(enhancedResults => {
        setSearchState(prev => ({
          ...prev,
          enrichedResults: enhancedResults,
          filteredResults: enhancedResults,
          sortedResults: enhancedResults,
          isEnhancingWithAI: false
      }));
      }).catch(error => {
        console.error('Failed to enhance with AI:', error);
        setSearchState(prev => ({ ...prev, isEnhancingWithAI: false }));
      });

      // Add to recent searches
      setRecentSearches([query, ...recentSearches.filter(s => s !== query)].slice(0, 10));
      setCurrentPrompt(query);

      // Show save prompt after successful search
      if (results.length > 0) {
        setTimeout(() => {
          addToast(
            `Search completed with ${results.length} results! Click the Save button to save this search.`,
            "success",
            5000
          );
        }, 1500); // Delay to let user see the results first
      }

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
  }, [recentSearches, setRecentSearches, setCurrentPrompt, handleSave, addToast]);

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
      
      const enrichedData = results.map((item: ExaResultItem) => processLinkedInData(item));
      const filteredData = applyFilters(enrichedData, searchState.columnFilters);
      const sortedData = sortData(filteredData, searchState.columnSort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);
      
      setSearchState(prev => ({
        ...prev,
        results,
        enrichedResults: enrichedData,
        filteredResults: filteredData,
        sortedResults: sortedData,
        currentResultCount: newResultCount,
        isLoadingMore: false
      }));

      // Enhance new data with Gemini AI
      enhanceWithGemini(enrichedData).then(enhancedResults => {
        const newFilteredData = applyFilters(enhancedResults, searchState.columnFilters);
        const newSortedData = sortData(newFilteredData, searchState.columnSort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);
        
        setSearchState(prev => ({
          ...prev,
          enrichedResults: enhancedResults,
          filteredResults: newFilteredData,
          sortedResults: newSortedData
        }));
      });

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
        filteredResults: savedSearch.enriched_results_data,
        sortedResults: savedSearch.enriched_results_data,
        columns: savedSearch.column_configuration,
        columnFilters: [],
        columnSort: null,
        error: null,
        aiProcessing: {},
        isAddingAIColumn: false,
        isEnhancingWithAI: false,
        currentResultCount: savedSearch.search_results_data?.length || 0,
        isLoadingMore: false,
        selectedRows: new Set()
      });
    } else if (savedSearch.search_results_data) {
      // Load basic saved search
      const enrichedData = savedSearch.search_results_data.map(item => processLinkedInData(item));
      setSearchState({
        query: savedSearch.query_text,
        isLoading: false,
        results: savedSearch.search_results_data,
        enrichedResults: enrichedData,
        filteredResults: enrichedData,
        sortedResults: enrichedData,
        columns: defaultColumns,
        columnFilters: [],
        columnSort: null,
        error: null,
        aiProcessing: {},
        isAddingAIColumn: false,
        isEnhancingWithAI: false,
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

  // Helper functions - defined before any conditional returns to maintain hook order
  const getUserInitials = useCallback((user: User) => {
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  }, []);

  const getUserDisplayName = useCallback((user: User) => {
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  }, []);

  // Function to generate a profile picture URL using a service like UI Avatars
  const generateProfilePicture = useCallback((authorName: string) => {
    if (!authorName || authorName === 'N/A') return null;
    
    // Use UI Avatars service to generate a nice profile picture
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = authorName.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
  }, []);

  // Helper function to check if a cell is being processed
  const isCellProcessing = useCallback((resultIndex: number, columnId: string): boolean => {
    return searchState.aiProcessing[resultIndex]?.[columnId] || false;
  }, [searchState.aiProcessing]);

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
      const allSelected = prev.selectedRows.size === prev.sortedResults.length;
      const newSelectedRows = allSelected 
        ? new Set<number>() 
        : new Set(prev.sortedResults.map((_, index) => index));
      return { ...prev, selectedRows: newSelectedRows };
    });
  }, []);

  const deleteSelectedRows = useCallback(() => {
    setSearchState(prev => {
      const indicesToDelete = Array.from(prev.selectedRows).sort((a, b) => b - a);
      const newResults = [...prev.results];
      const newEnrichedResults = [...prev.enrichedResults];
      
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

  // Function to process LinkedIn data - now just returns the original data
  // The AI enhancement will be done separately via Gemini
  const processLinkedInData = useCallback((result: ExaResultItem): EnrichedExaResultItem => {
    return {
      ...result,
      cleanPosition: result.title || 'N/A', // Use original title for now
      extractedCompany: 'N/A' // Will be enhanced by AI
    };
  }, []);

  // Function to enhance position and company data using Gemini AI
  const enhanceWithGemini = useCallback(async (results: EnrichedExaResultItem[]): Promise<EnrichedExaResultItem[]> => {
    try {
      // Prepare data for Gemini analysis
      const dataForAnalysis = results.map((item, index) => ({
        index,
        author: item.author,
        title: item.title,
        url: item.url
      }));

      const prompt = `You are an expert at analyzing LinkedIn profile data. Extract clean, professional position titles and company names from the provided LinkedIn profiles.

For each profile, extract:
1. Position: A clean, professional job title (e.g., "Software Engineer", "Marketing Director", "Sales Manager")
2. Company: The company name where the person works

Rules:
- Keep position titles concise and professional
- Remove redundant words like "Assistante de", "Assistant", etc. when they're not the core role
- For French titles like "Assistante de direction", convert to "Executive Assistant"
- Extract actual company names from the current job info or experiences
- If you can't determine a clear position or company, use "N/A"
- Return ONLY valid JSON array, no markdown formatting, no explanations

Input data:
${JSON.stringify(dataForAnalysis, null, 2)}

Return only this JSON format:
[{"index":0,"position":"Job Title","company":"Company Name"},{"index":1,"position":"Job Title","company":"Company Name"}]`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Gemini response');
      }

      const { text } = await response.json();
      
      // Clean the response text - remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Parse the JSON response from Gemini
      let enhancedData;
      try {
        enhancedData = JSON.parse(cleanText);
        console.log('Successfully parsed Gemini response:', enhancedData);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', cleanText);
        console.error('Parse error:', parseError);
        throw new Error('Invalid JSON response from Gemini');
      }
      
      // Validate the response structure
      if (!Array.isArray(enhancedData)) {
        console.error('Gemini response is not an array:', enhancedData);
        throw new Error('Invalid response format from Gemini');
      }
      
      // Apply the enhanced data to the results
      const enhancedResults = results.map((result, index) => {
        const enhancement = enhancedData.find((item: { index: number; position: string; company: string }) => item.index === index);
        if (enhancement && enhancement.position && enhancement.company) {
          return {
            ...result,
            cleanPosition: enhancement.position,
            extractedCompany: enhancement.company
          };
        }
        return {
          ...result,
          cleanPosition: result.title || 'N/A',
          extractedCompany: 'N/A'
        };
      });

      console.log('Enhanced results:', enhancedResults);
      return enhancedResults;
    } catch (error) {
      console.error('Error enhancing data with Gemini:', error);
      // Return original data if enhancement fails
      return results;
    }
  }, []);

  // Column filtering functions
  const applyFilters = useCallback((data: EnrichedExaResultItem[], filters: ColumnFilter[]): EnrichedExaResultItem[] => {
    if (filters.length === 0) return data;

    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.columnId as keyof EnrichedExaResultItem];
        const stringValue = value ? value.toString().toLowerCase() : '';
        
        if (Array.isArray(filter.value)) {
          // Select filter type
          return filter.value.some(filterVal => 
            stringValue.includes(filterVal.toLowerCase())
          );
        } else {
          const filterValue = filter.value.toLowerCase();
          
          switch (filter.type) {
            case 'contains':
              return stringValue.includes(filterValue);
            case 'text':
              return stringValue === filterValue;
            case 'startsWith':
              return stringValue.startsWith(filterValue);
            case 'endsWith':
              return stringValue.endsWith(filterValue);
            default:
              return stringValue.includes(filterValue);
          }
        }
      });
    });
  }, []);

  const handleColumnFilterChange = useCallback((columnId: string, filter: ColumnFilter | null) => {
    setSearchState(prev => {
      const newFilters = filter 
        ? [...prev.columnFilters.filter(f => f.columnId !== columnId), filter]
        : prev.columnFilters.filter(f => f.columnId !== columnId);
      
      const filteredResults = applyFilters(prev.enrichedResults, newFilters);
      const sortedResults = sortData(filteredResults, prev.columnSort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);
      
      return {
        ...prev,
        columnFilters: newFilters,
        filteredResults,
        sortedResults,
        selectedRows: new Set() // Clear selection when filters change
      };
    });
  }, [applyFilters]);

  const clearAllFilters = useCallback(() => {
    setSearchState(prev => {
      const sortedResults = sortData(prev.enrichedResults, prev.columnSort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);
      return {
        ...prev,
        columnFilters: [],
        filteredResults: prev.enrichedResults,
        sortedResults,
        selectedRows: new Set()
      };
    });
  }, []);

  // Column sort handler
  const handleColumnSortChange = useCallback((sort: ColumnSort | null) => {
    setSearchState(prev => {
      const sortedResults = sortData(prev.filteredResults, sort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);
      return {
        ...prev,
        columnSort: sort,
        sortedResults,
        selectedRows: new Set() // Clear selection when sort changes
      };
    });
  }, []);

  // Remove column handler
  const removeColumn = useCallback((columnId: string) => {
    setSearchState(prev => {
      // Don't allow removing if it would leave less than 1 column
      if (prev.columns.length <= 1) {
        return prev;
      }

      // Find the column to remove
      const columnToRemove = prev.columns.find(col => col.id === columnId);
      if (!columnToRemove) {
        return prev;
      }

      // Remove the column from the columns array
      const newColumns = prev.columns.filter(col => col.id !== columnId);

      // Remove any filters for this column
      const newColumnFilters = prev.columnFilters.filter(filter => filter.columnId !== (columnToRemove.accessorKey || columnId));

      // Clear sort if it was on the removed column
      const newColumnSort = prev.columnSort?.columnId === (columnToRemove.accessorKey || columnId) ? null : prev.columnSort;

      // Remove the column data from enriched results if it's an AI-generated column
      let newEnrichedResults = prev.enrichedResults;
      if (columnToRemove.type === 'ai-generated' && columnToRemove.accessorKey) {
        newEnrichedResults = prev.enrichedResults.map(result => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [columnToRemove.accessorKey!]: _, ...rest } = result;
          return rest as EnrichedExaResultItem;
        });
      }

      // Reapply filters and sorting
      const filteredResults = applyFilters(newEnrichedResults, newColumnFilters);
      const sortedResults = sortData(filteredResults, newColumnSort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);

      return {
        ...prev,
        columns: newColumns,
        columnFilters: newColumnFilters,
        columnSort: newColumnSort,
        enrichedResults: newEnrichedResults,
        filteredResults,
        sortedResults,
        selectedRows: new Set() // Clear selection when columns change
      };
    });
  }, [applyFilters]);

  // Update filtered and sorted results when enriched results change
  useEffect(() => {
    setSearchState(prev => {
      const filteredResults = applyFilters(prev.enrichedResults, prev.columnFilters);
      const sortedResults = sortData(filteredResults, prev.columnSort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);
      return {
        ...prev,
        filteredResults,
        sortedResults
      };
    });
  }, [searchState.enrichedResults, applyFilters]);

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

  // This component now handles both authenticated users and development mode
  // Landing page is handled in the main page component
  // Temporarily allow access without authentication
  // if (!user) { return null; }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 top-0 lg:flex-shrink-0
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
        <main className="flex-1 overflow-hidden min-h-0 w-full">
          <div className="h-full w-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 pb-8">

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
                      {searchState.columnFilters.length > 0 || searchState.columnSort ? (
                        <>
                          Showing <span className="font-medium text-foreground">{searchState.sortedResults.length}</span> of <span className="font-medium text-foreground">{searchState.results.length}</span> results for <span className="font-medium text-foreground">&quot;{searchState.query}&quot;</span>
                          {searchState.columnFilters.length > 0 && (
                            <span className="text-blue-600 dark:text-blue-400"> ({searchState.columnFilters.length} filter{searchState.columnFilters.length > 1 ? 's' : ''} applied)</span>
                          )}
                          {searchState.columnSort && (
                            <span className="text-green-600 dark:text-green-400"> (sorted by {searchState.columns.find(c => (c.accessorKey || c.id) === searchState.columnSort?.columnId)?.header} {searchState.columnSort.direction === 'asc' ? '↑' : '↓'})</span>
                          )}
                          {searchState.isEnhancingWithAI && (
                            <span className="text-purple-600 dark:text-purple-400"> (✨ AI enhancing position & company data...)</span>
                          )}
                        </>
                      ) : (
                        <>
                          Found <span className="font-medium text-foreground">{searchState.results.length}</span> results for <span className="font-medium text-foreground">&quot;{searchState.query}&quot;</span>
                          {searchState.isEnhancingWithAI && (
                            <span className="text-purple-600 dark:text-purple-400"> (✨ AI enhancing position & company data...)</span>
                          )}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {searchState.columnFilters.length > 0 && (
                  <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        size="sm"
                        className="mr-2"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters ({searchState.columnFilters.length})
                      </Button>
                    )}
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
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            const { [column.accessorKey || '']: _, ...rest } = result;
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
                      <Button 
                        onClick={handleSave} 
                        variant="default" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save Search ({searchState.results.length} results)
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResultsTable
                    results={searchState.sortedResults}
                    columns={searchState.columns}
                    isAddingAIColumn={searchState.isAddingAIColumn}
                    aiProcessing={searchState.aiProcessing}
                    selectedRows={searchState.selectedRows}
                    onRowSelection={(selectedRows) => setSearchState(prev => ({ ...prev, selectedRows }))}
                    columnFilters={searchState.columnFilters}
                    onColumnFiltersChange={(filters) => setSearchState(prev => ({ ...prev, columnFilters: filters }))}
                    columnSort={searchState.columnSort}
                    onColumnSortChange={handleColumnSortChange}
                    isLoading={searchState.isLoading}
                  />
                </CardContent>
                {/* Load More Results Button */}
                {searchState.results.length > 0 && searchState.currentResultCount < 100 && (
                  <div className="px-6 pb-20">
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
            <div className="bg-background border-t p-4 flex-shrink-0">
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