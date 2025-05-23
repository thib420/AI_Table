"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Plus, Sparkles, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EnrichedExaResultItem, ColumnDef } from '../../services/ai-column-generator';
import { ColumnFilter } from '@/components/common/ColumnFilter';
import { ColumnSortIndicator, ColumnSort, sortData } from '@/components/common/ColumnSort';

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
  columnFilters?: ColumnFilter[];
  onColumnFiltersChange?: (filters: ColumnFilter[]) => void;
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
  columnFilters = [],
  onColumnFiltersChange,
  columnSort,
  onColumnSortChange,
  isLoading = false
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters and sorting
  const processedResults = useMemo(() => {
    let filtered = results;

    // Apply column filters
    if (columnFilters.length > 0) {
      filtered = filtered.filter(result => {
        return columnFilters.every(filter => {
          const value = String((result as any)[filter.columnId] || '').toLowerCase();
          const filterValue = filter.value.toLowerCase();
          
          switch (filter.operator) {
            case 'contains':
              return value.includes(filterValue);
            case 'equals':
              return value === filterValue;
            case 'startsWith':
              return value.startsWith(filterValue);
            case 'endsWith':
              return value.endsWith(filterValue);
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (columnSort) {
      filtered = sortData(filtered, columnSort, (item, colId) => (item as any)[colId]);
    }

    return filtered;
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

  const defaultColumns: ColumnDef[] = [
    { id: 'title', header: 'Title', accessorKey: 'title', type: 'default' },
    { id: 'author', header: 'Author', accessorKey: 'author', type: 'default' },
    { id: 'url', header: 'URL', accessorKey: 'url', type: 'default' },
    { id: 'text', header: 'Description', accessorKey: 'text', type: 'default' }
  ];

  const allColumns = [...defaultColumns, ...columns.filter(col => col.type === 'ai-generated')];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {processedResults.length} result{processedResults.length !== 1 ? 's' : ''}
            {results.length !== processedResults.length && ` (filtered from ${results.length})`}
          </span>
          {selectedRows.size > 0 && (
            <Badge variant="secondary">
              {selectedRows.size} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          {onAddAIColumn && (
            <Button
              onClick={onAddAIColumn}
              disabled={isAddingAIColumn}
              size="sm"
            >
              {isAddingAIColumn ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add AI Column
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && onColumnFiltersChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Column Filters</CardTitle>
            <CardDescription className="text-xs">
              Advanced filtering coming soon! Use search in the meantime.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 w-12">
                  <Checkbox
                    checked={selectedRows.size === results.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                {allColumns.map((column) => (
                  <th key={column.id} className="text-left p-3 min-w-[150px]">
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
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-3">
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
                          >
                            <ExternalLink className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{value}</span>
                          </a>
                        ) : column.accessorKey === 'text' ? (
                          <div className="text-sm text-muted-foreground line-clamp-3">
                            {String(value).substring(0, 200)}
                            {String(value).length > 200 && '...'}
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
      </Card>
    </div>
  );
}; 