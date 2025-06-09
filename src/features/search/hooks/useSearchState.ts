import { useState, useCallback, useEffect } from 'react';
import { SearchState } from '@/types/search';
import { ExaResultItem } from '@/types/exa';
import { ColumnDef, EnrichedExaResultItem } from '@/features/search/services/ai-column-generator';
import { SavedSearchItem, CompleteSearchState } from '@/features/search/components/SearchHistoryManager';
import { ColumnFilter } from '@/features/search/components/ColumnFilter';
import { ColumnSort } from '@/features/search/components/ColumnSort';
import { SearchService } from '@/features/search/services/searchService';
import { DataProcessingUtils } from '@/lib/dataProcessing';
import { useToast } from '@/components/ui/toast';

const defaultColumns: ColumnDef[] = [
  { id: 'author', header: 'Author', accessorKey: 'author', type: 'default' },
  { id: 'cleanTitle', header: 'Title', accessorKey: 'cleanTitle', type: 'default' },
  { id: 'company', header: 'Company', accessorKey: 'company', type: 'default' },
  { id: 'description', header: 'Description', accessorKey: 'cleanDescription', type: 'default' },
  { id: 'url', header: 'LinkedIn URL', accessorKey: 'url', type: 'default' },
];

export function useSearchState(
  currentPrompt: string,
  setCurrentPrompt: (prompt: string) => void,
  recentSearches: string[],
  setRecentSearches: (searches: string[]) => void
) {
  const { addToast } = useToast();
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
    selectedRows: new Set(),
    selectedProfile: null,
  });

  // Update search query when currentPrompt changes
  useEffect(() => {
    setSearchState(prev => ({ ...prev, query: currentPrompt }));
  }, [currentPrompt]);

  // Update filtered and sorted results when enriched results change
  useEffect(() => {
    setSearchState(prev => {
      const processedResults = DataProcessingUtils.processAndSort(
        prev.enrichedResults,
        prev.columnFilters,
        prev.columnSort
      );
      return {
        ...prev,
        filteredResults: DataProcessingUtils.applyFilters(prev.enrichedResults, prev.columnFilters),
        sortedResults: processedResults
      };
    });
  }, [searchState.enrichedResults]);

  const performSearch = useCallback(async (query: string, numResults: number = 10) => {
    if (!query.trim()) return;

    setSearchState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      query: query.trim(),
      aiProcessing: {},
      selectedProfile: null,
    }));

    try {
      const results = await SearchService.performSearch(query, numResults);
      console.log('🔍 Raw results from search:', results.slice(0, 2)); // Log first 2 results
      const enrichedData = results.map(SearchService.processLinkedInData);
      console.log('🔍 Enriched data after processing:', enrichedData.slice(0, 2)); // Log first 2 enriched results
      
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
        selectedRows: new Set(),
        selectedProfile: null,
      }));

      // Enhance data with Gemini AI in the background
      setSearchState(prev => ({ ...prev, isEnhancingWithAI: true }));
      SearchService.enhanceWithGemini(enrichedData).then(enhancedResults => {
        setSearchState(prev => ({
          ...prev,
          enrichedResults: enhancedResults,
          filteredResults: enhancedResults,
          sortedResults: enhancedResults,
          isEnhancingWithAI: false,
          selectedProfile: null,
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
        }, 1500);
      }

    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
        aiProcessing: {},
        isAddingAIColumn: false,
        isLoadingMore: false,
        selectedRows: new Set(),
        selectedProfile: null,
      }));
    }
  }, [recentSearches, setRecentSearches, setCurrentPrompt, addToast]);

  const loadMoreResults = useCallback(async () => {
    if (!searchState.query || searchState.isLoadingMore) return;

    const newResultCount = Math.min(searchState.currentResultCount + 10, 100);
    
    setSearchState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      // Fetch the new, larger list of results
      const newResults = await SearchService.performSearch(searchState.query, newResultCount);
      
      // Identify only the new items that we haven't processed yet
      const existingResultIds = new Set(searchState.results.map(r => r.id));
      const newItems = newResults.filter(r => !existingResultIds.has(r.id));

      if (newItems.length > 0) {
        // Process only the new items
        const processedNewItems = newItems.map(SearchService.processLinkedInData);
        
        // Enhance only the new items with Gemini
        const enhancedNewItems = await SearchService.enhanceWithGemini(processedNewItems);

        // Combine with existing enriched results
        const combinedEnrichedResults = [...searchState.enrichedResults, ...enhancedNewItems];

        setSearchState(prev => ({
          ...prev,
          results: newResults,
          enrichedResults: combinedEnrichedResults,
          currentResultCount: newResultCount,
          isLoadingMore: false,
        }));
      } else {
        // No new items found, just stop loading
        setSearchState(prev => ({ ...prev, isLoadingMore: false }));
      }
    } catch (error) {
      console.error('Load more error:', error);
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load more results',
        isLoadingMore: false,
      }));
    }
  }, [searchState.query, searchState.currentResultCount, searchState.isLoadingMore, searchState.results, searchState.enrichedResults]);

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
        selectedRows: new Set(),
        selectedProfile: null,
      });
    } else if (savedSearch.search_results_data) {
      // Load basic saved search
      const enrichedData = savedSearch.search_results_data.map(SearchService.processLinkedInData);
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
        selectedRows: new Set(),
        selectedProfile: null,
      });
    } else {
      // Fallback: perform new search
      performSearch(savedSearch.query_text);
    }
    setCurrentPrompt(savedSearch.query_text);
  }, [performSearch, setCurrentPrompt]);

  const handleColumnFilterChange = useCallback((columnId: string, filter: ColumnFilter | null) => {
    setSearchState(prev => {
      const newFilters = filter 
        ? [...prev.columnFilters.filter(f => f.columnId !== columnId), filter]
        : prev.columnFilters.filter(f => f.columnId !== columnId);
      
      const processedResults = DataProcessingUtils.processAndSort(
        prev.enrichedResults,
        newFilters,
        prev.columnSort
      );
      
      return {
        ...prev,
        columnFilters: newFilters,
        filteredResults: DataProcessingUtils.applyFilters(prev.enrichedResults, newFilters),
        sortedResults: processedResults,
        selectedRows: new Set()
      };
    });
  }, []);

  const handleColumnSortChange = useCallback((sort: ColumnSort | null) => {
    setSearchState(prev => {
      const sortedResults = DataProcessingUtils.sortResults(prev.filteredResults, sort);
      return {
        ...prev,
        columnSort: sort,
        sortedResults,
        selectedRows: new Set()
      };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchState(prev => {
      const sortedResults = DataProcessingUtils.sortResults(prev.enrichedResults, prev.columnSort);
      return {
        ...prev,
        columnFilters: [],
        filteredResults: prev.enrichedResults,
        sortedResults,
        selectedRows: new Set()
      };
    });
  }, []);

  const handleRowSelection = useCallback((selectedRows: Set<number>) => {
    setSearchState(prev => ({
      ...prev,
      selectedRows
    }));
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

  const handleSelectProfile = useCallback((profile: EnrichedExaResultItem | null) => {
    setSearchState(prev => ({
      ...prev,
      selectedProfile: profile
    }));
  }, []);

  const getCompleteSearchState = useCallback((): CompleteSearchState => {
    return {
      query: searchState.query,
      originalResults: searchState.results,
      enrichedResults: searchState.enrichedResults,
      columnConfiguration: searchState.columns
    };
  }, [searchState]);

  return {
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
  };
} 