"use client";

import React from 'react';
import { Search, Plus, Trash2, X, Sparkles, ChevronDown, Bookmark, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResultsTable } from '@/features/search/components/ResultsTable';
import { AIColumnGenerator } from '@/features/search/services/ai-column-generator';
import { SearchResultsProps as SearchResultsPropsType } from '@/types/search';
import { EnrichedExaResultItem } from '../services/ai-column-generator';
import { ProfileSidebar } from './ProfileSidebar';

interface SearchResultsProps extends SearchResultsPropsType {
  onProfileSelect: (profile: EnrichedExaResultItem | null) => void;
}

export function SearchResults({
  searchState,
  onColumnFilterChange,
  onColumnSortChange,
  onClearAllFilters,
  onDeleteSelectedRows,
  onAddAIColumn,
  onLoadMoreResults,
  onSave,
  onRowSelection,
  onProfileSelect,
  isAddingAIColumn,
  selectedRowsCount,
  onContactsCreated
}: SearchResultsProps) {
  // Empty State - Clean welcome screen
  if (!searchState.isLoading && searchState.results.length === 0 && !searchState.error && !searchState.query) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
          <Users className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl font-bold">AI Table</h1>
          <p className="text-lg text-muted-foreground">
            Search for professional profiles and analyze them with AI-powered insights
          </p>
        </div>
        <div className="bg-muted/30 rounded-xl p-6 max-w-lg">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Try these searches:</span><br />
            • "Software engineers in San Francisco"<br />
            • "Marketing directors at tech companies"<br />
            • "Product managers in Paris"
          </p>
        </div>
      </div>
    );
  }

  // Loading State - Clean loading animation
  if (searchState.isLoading && searchState.results.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Searching...</h3>
          <p className="text-muted-foreground">
            Finding professional profiles for "{searchState.query}"
          </p>
        </div>
      </div>
    );
  }

  // Error State - Clean error display
  if (searchState.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-8">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <X className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Search failed</h3>
          <p className="text-muted-foreground">{searchState.error}</p>
        </div>
      </div>
    );
  }

  // No Results State
  if (!searchState.isLoading && searchState.results.length === 0 && searchState.query) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-8">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or try a different query
          </p>
        </div>
      </div>
    );
  }

  // Results Display - Clean results with header
  if (searchState.results.length > 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Results Header */}
        <div className="flex-shrink-0 space-y-2 mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Search Results</h2>
              <p className="text-muted-foreground">
                {searchState.columnFilters.length > 0 || searchState.columnSort ? (
                  <>
                    Showing <span className="font-medium text-foreground">{searchState.sortedResults.length}</span> of <span className="font-medium text-foreground">{searchState.results.length}</span> results for <span className="font-medium text-foreground">"{searchState.query}"</span>
                    {searchState.columnFilters.length > 0 && (
                      <span className="text-blue-600 dark:text-blue-400"> ({searchState.columnFilters.length} filter{searchState.columnFilters.length > 1 ? 's' : ''} applied)</span>
                    )}
                    {searchState.columnSort && (
                      <span className="text-green-600 dark:text-green-400"> (sorted by {searchState.columns.find(c => (c.accessorKey || c.id) === searchState.columnSort?.columnId)?.header} {searchState.columnSort.direction === 'asc' ? '↑' : '↓'})</span>
                    )}
                    {searchState.isEnhancingWithAI && (
                      <span className="text-purple-600 dark:text-purple-400"> (✨ AI enhancing...)</span>
                    )}
                  </>
                ) : (
                  <>
                    Found <span className="font-medium text-foreground">{searchState.results.length}</span> results for <span className="font-medium text-foreground">"{searchState.query}"</span>
                    {searchState.isEnhancingWithAI && (
                      <span className="text-purple-600 dark:text-purple-400"> (✨ AI enhancing...)</span>
                    )}
                  </>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {searchState.columnFilters.length > 0 && (
                <Button
                  onClick={onClearAllFilters}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters ({searchState.columnFilters.length})
                </Button>
              )}
              
              {selectedRowsCount > 0 && (
                <Button
                  onClick={onDeleteSelectedRows}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedRowsCount})
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isAddingAIColumn}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500 hover:from-purple-600 hover:via-violet-600 hover:to-blue-600 text-white border-0"
                  >
                    {isAddingAIColumn ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Columns
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto rounded-xl" align="end">
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
                            onClick={() => onAddAIColumn(preset.name, preset.prompt)}
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
                        onAddAIColumn(columnName, columnPrompt);
                      }
                    }}
                    className="text-sm py-2 cursor-pointer"
                  >
                    <Plus className="h-3 w-3 mr-2 text-blue-500" />
                    Add Custom Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Results Table - Full Height */}
        <div className="border border-border rounded-xl overflow-hidden">
          <ResultsTable
            results={searchState.sortedResults}
            columns={searchState.columns}
            onRowClick={onProfileSelect}
            isAddingAIColumn={searchState.isAddingAIColumn}
            aiProcessing={searchState.aiProcessing}
            selectedRows={(() => {
              // Map selected indices from original results to sortedResults indices
              const sortedIndices = new Set<number>();
              searchState.selectedRows.forEach(originalIndex => {
                const originalResult = searchState.enrichedResults[originalIndex];
                if (originalResult) {
                  const sortedIndex = searchState.sortedResults.findIndex(
                    sortedResult => sortedResult.id === originalResult.id
                  );
                  if (sortedIndex !== -1) {
                    sortedIndices.add(sortedIndex);
                  }
                }
              });
              return sortedIndices;
            })()}
            onRowSelection={(selectedSortedRows) => {
              // Map sorted indices back to original indices
              const originalIndices = new Set<number>();
              selectedSortedRows.forEach(sortedIndex => {
                const sortedResult = searchState.sortedResults[sortedIndex];
                if (sortedResult) {
                  const originalIndex = searchState.enrichedResults.findIndex(
                    originalResult => originalResult.id === sortedResult.id
                  );
                  if (originalIndex !== -1) {
                    originalIndices.add(originalIndex);
                  }
                }
              });
              onRowSelection(originalIndices);
            }}
            columnFilters={searchState.columnFilters}
            onColumnFiltersChange={(filters) => {
              // Handle filter changes if needed
            }}
            columnSort={searchState.columnSort}
            onColumnSortChange={onColumnSortChange}
          />
        </div>
        
        <ProfileSidebar 
          profile={searchState.selectedProfile} 
          onClose={() => onProfileSelect(null)} 
        />

        {/* Load More Button */}
        {searchState.currentResultCount < 100 && (
          <div className="flex-shrink-0 text-center mt-4">
            <Button
              onClick={onLoadMoreResults}
              disabled={searchState.isLoadingMore}
              variant="outline"
              className="w-full max-w-xs"
            >
              {searchState.isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Loading more...
                </>
              ) : (
                `Load more results (${Math.min(searchState.currentResultCount + 10, 100) - searchState.currentResultCount} more)`
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
} 