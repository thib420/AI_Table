import { User } from '@supabase/supabase-js';
import { ExaResultItem } from '@/shared/types/exa';
import { ColumnDef, EnrichedExaResultItem } from '@/modules/search/services/ai-column-generator';
import { SavedSearchItem } from '@/modules/search/components/SearchHistoryManager';
import { ColumnFilter } from '@/components/common/ColumnFilter';
import { ColumnSort } from '@/components/common/ColumnSort';

export interface SearchState {
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

export interface AppLayoutProps {
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

export interface SearchSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  savedSearches: SavedSearchItem[];
  recentSearches: string[];
  isLoadingDelete: boolean;
  onSavedSearchClick: (search: SavedSearchItem) => void;
  onRecentSearchClick: (query: string) => void;
  onDeleteSavedSearch: (id: string) => void;
}

export interface SearchInputProps {
  query: string;
  isLoading: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
}

export interface SearchResultsProps {
  searchState: SearchState;
  onColumnFilterChange: (columnId: string, filter: ColumnFilter | null) => void;
  onColumnSortChange: (sort: ColumnSort | null) => void;
  onClearAllFilters: () => void;
  onDeleteSelectedRows: () => void;
  onAddAIColumn: (columnName: string, prompt: string) => void;
  onLoadMoreResults: () => void;
  onSave: () => void;
  isAddingAIColumn: boolean;
  selectedRowsCount: number;
} 