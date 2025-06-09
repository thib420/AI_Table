"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Plus, Sparkles, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EnrichedExaResultItem, ColumnDef } from '../../services/ai-column-generator';
import { ColumnFilter as ColumnFilterType } from '@/features/search/components/ColumnFilter';
import { ColumnSortIndicator, ColumnSort, sortData } from '@/features/search/components/ColumnSort';
import { DataProcessingUtils } from '@/lib/dataProcessing';

interface ResultsTableProps {
  results: EnrichedExaResultItem[];
  columns: ColumnDef[];
  onAddAIColumn?: () => void;
  isAddingAIColumn?: boolean;
  aiProcessing?: {
    [resultIndex: number]: {
      [columnId: string]: boolean;
    };
  };
  selectedRows?: Set<number>;
  onRowSelection?: (selectedRows: Set<number>) => void;
  onRowClick?: (profile: EnrichedExaResultItem) => void;
  columnFilters?: ColumnFilterType[];
  onColumnFiltersChange?: (filters: ColumnFilterType[]) => void;
  columnSort?: ColumnSort | null;
  onColumnSortChange?: (sort: ColumnSort | null) => void;
  isLoading?: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  columns,
  onAddAIColumn,
  isAddingAIColumn = false,
  aiProcessing = {},
  selectedRows = new Set(),
  onRowSelection,
  onRowClick,
  columnFilters = [],
  onColumnFiltersChange,
  columnSort,
  onColumnSortChange,
  isLoading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const getCompanyLogoUrl = (companyUrl?: string): string | null => {
    if (!companyUrl || companyUrl === 'N/A') {
      return null;
    }
    try {
      const fullUrl = companyUrl.startsWith('http') ? companyUrl : `https://` + companyUrl;
      const url = new URL(fullUrl);
      return `https://logo.clearbit.com/${url.hostname}`;
    } catch (e) {
      console.error("Invalid company URL for logo:", companyUrl);
      return null;
    }
  };

  // Apply filters and sorting
  const processedResults = useMemo(() => {
    let filteredData = results;

    // Apply column filters
    if (columnFilters.length > 0) {
      // This is delegated to the parent, but if filters are passed, we apply them
      // This might be redundant if parent already filters, but ensures consistency.
      filteredData = DataProcessingUtils.applyFilters(results, columnFilters);
    }

    // Apply sorting
    if (columnSort) {
      filteredData = sortData(filteredData, columnSort, (item, colId) => (item as any)[colId]);
    }

    return filteredData;
  }, [results, columnFilters, columnSort]);

  const handleSelectAll = (checked: boolean) => {
    if (!onRowSelection) return;
    
    if (checked) {
      const allIndexes = new Set(Array.from({ length: results.length }, (_, i) => i));
      onRowSelection(allIndexes);
    } else {
      onRowSelection(new Set());
    }
  };

  const handleRowSelect = (index: number, checked: boolean) => {
    if (!onRowSelection) return;

    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(index);
    } else {
      newSelection.delete(index);
    }
    onRowSelection(newSelection);
  };

  const handleSort = (columnId: string) => {
    if (!onColumnSortChange) return;

    let newSort: ColumnSort | null = null;

    if (!columnSort || columnSort.columnId !== columnId) {
      newSort = { columnId, direction: 'asc' };
    } else if (columnSort.direction === 'asc') {
      newSort = { columnId, direction: 'desc' };
    } else {
      newSort = null; // Remove sorting
    }

    onColumnSortChange(newSort);
  };

  const getSortIcon = (columnId: string) => {
    if (!columnSort || columnSort.columnId !== columnId) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return columnSort.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading results...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No results found. Try a different search query.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use the columns passed as props for default columns, and add AI-generated columns
  const defaultColumns = columns.filter(col => col.type === 'default');
  const aiColumns = columns.filter(col => col.type === 'ai-generated');
  const allColumns = [...defaultColumns, ...aiColumns];

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      {showFilters && onColumnFiltersChange && (
        <div className="flex-shrink-0 p-4 border-b bg-muted/20 rounded-t-xl">
          <div>
            <h4 className="text-sm font-medium">Column Filters</h4>
            <p className="text-xs text-muted-foreground">
              Advanced filtering coming soon! Use search in the meantime.
            </p>
          </div>
        </div>
      )}

      {/* Table - Full Height with Scroll */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background border-b z-10">
            <tr>
              <th className="text-left p-3 w-12 bg-background">
                <Checkbox
                  checked={selectedRows.size === results.length}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              {allColumns.map((column) => (
                <th key={column.id} className={`text-left p-3 bg-background ${column.accessorKey === 'author' ? 'min-w-[200px]' : 'min-w-[150px]'}`}>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{column.header}</span>
                    {column.type === 'ai-generated' && (
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    )}
                    {onColumnSortChange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSort(column.accessorKey || column.id)}
                      >
                        {getSortIcon(column.accessorKey || column.id)}
                      </Button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedResults.map((result, index) => (
              <tr 
                key={result.id || index} 
                className="border-b hover:bg-muted/50 cursor-pointer"
                onClick={() => onRowClick?.(result)}
              >
                <td 
                  className="p-3"
                  onClick={(e) => e.stopPropagation()} // Prevent row click from triggering when clicking checkbox
                >
                  <Checkbox
                    checked={selectedRows.has(index)}
                    onCheckedChange={(checked) => handleRowSelect(index, checked as boolean)}
                  />
                </td>
                {allColumns.map((column) => {
                  const value = column.accessorKey ? (result as any)[column.accessorKey] : '';
                  const isProcessing = aiProcessing[index]?.[column.id];

                  return (
                    <td key={column.id} className="p-3 max-w-[300px]">
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                          <span className="text-sm text-muted-foreground">Processing...</span>
                        </div>
                      ) : column.accessorKey === 'url' ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{value}</span>
                        </a>
                      ) : column.accessorKey === 'cleanDescription' ? (
                        <div className="text-sm text-muted-foreground max-w-md">
                          <div className="line-clamp-2 leading-relaxed">
                            {String(value)}
                          </div>
                        </div>
                      ) : column.accessorKey === 'company' ? (
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const logoUrl = getCompanyLogoUrl(result.companyUrl);
                            const fallbackLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(String(value).charAt(0) || 'C')}&size=40&background=e5e7eb&color=374151&bold=true&format=png`;
                            
                            return (
                              <img
                                src={logoUrl || fallbackLogoUrl}
                                alt={`${String(value)} logo`}
                                className="w-8 h-8 rounded-md flex-shrink-0 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src !== fallbackLogoUrl) {
                                    target.src = fallbackLogoUrl;
                                  }
                                }}
                              />
                            );
                          })()}
                          <span className="text-sm font-medium truncate">
                            {String(value)}
                          </span>
                        </div>
                      ) : column.accessorKey === 'author' ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={String(result.image || result.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(String(value))}&size=40&background=6366f1&color=fff&bold=true&format=png`)}
                            alt={`${String(value)} profile`}
                            className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-100"
                            onError={(e) => {
                              // Fallback to generated avatar if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(String(value))}&size=40&background=6366f1&color=fff&bold=true&format=png`;
                            }}
                          />
                          <span className="text-sm font-medium truncate">
                            {String(value)}
                          </span>
                        </div>
                      ) : (
                        <div className="truncate" title={String(value)}>
                          {String(value)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 