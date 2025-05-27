"use client";

import React from 'react';
import { Search, Plus, Trash2, X, Sparkles, ChevronDown, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResultsTable } from '@/modules/search/components/ResultsTable';
import { AIColumnGenerator } from '@/modules/search/services/ai-column-generator';
import { SearchResultsProps } from '@/shared/types/search';

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
  isAddingAIColumn,
  selectedRowsCount
}: SearchResultsProps) {
  // Empty State
  if (!searchState.isLoading && searchState.results.length === 0 && !searchState.error) {
    return (
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
    );
  }

  // Loading State
  if (searchState.isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Searching...</h3>
          <p className="text-sm text-muted-foreground">
            Finding professional profiles for &quot;{searchState.query}&quot;
          </p>
        </div>
      </div>
    );
  }

  // Error Display
  if (searchState.error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-destructive rounded-full"></div>
            <p className="text-sm text-destructive font-medium">{searchState.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results Display
  if (searchState.results.length > 0) {
    return (
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
                onClick={onClearAllFilters}
                variant="outline"
                size="sm"
                className="mr-2"
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
                className="mr-2"
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
                  className="bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500 hover:from-purple-600 hover:via-violet-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-violet-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {isAddingAIColumn ? (
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
                                // This would need to be handled by the parent component
                                console.log('Remove column:', column.id);
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
                onClick={onSave} 
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
            selectedRows={(() => {
              // Map selected indices from original results to sortedResults indices
              const sortedIndices = new Set<number>();
              searchState.selectedRows.forEach(originalIndex => {
                const originalItem = searchState.enrichedResults[originalIndex];
                if (originalItem) {
                  const sortedIndex = searchState.sortedResults.findIndex(item => 
                    item.id === originalItem.id || 
                    (item.url === originalItem.url && item.author === originalItem.author)
                  );
                  if (sortedIndex !== -1) {
                    sortedIndices.add(sortedIndex);
                  }
                }
              });
              return sortedIndices;
            })()}
            onRowSelection={(selectedRows) => {
              // Map the selected indices from sortedResults back to original results indices
              const originalIndices = new Set<number>();
              selectedRows.forEach(sortedIndex => {
                const sortedItem = searchState.sortedResults[sortedIndex];
                if (sortedItem) {
                  const originalIndex = searchState.enrichedResults.findIndex(item => 
                    item.id === sortedItem.id || 
                    (item.url === sortedItem.url && item.author === sortedItem.author)
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
              // Note: ResultsTable expects a different interface - this would need refactoring
              console.log('Column filters changed:', filters);
            }}
            columnSort={searchState.columnSort}
            onColumnSortChange={onColumnSortChange}
            isLoading={searchState.isLoading}
          />
        </CardContent>
        {/* Load More Results Button */}
        {searchState.results.length > 0 && searchState.currentResultCount < 100 && (
          <div className="px-6 pb-20">
            <Button
              onClick={onLoadMoreResults}
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
    );
  }

  return null;
} 