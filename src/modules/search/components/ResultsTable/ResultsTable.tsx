"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Plus, Sparkles, Filter, ArrowUpDown, ArrowUp, ArrowDown, UserPlus } from 'lucide-react';
import { EnrichedExaResultItem, ColumnDef } from '../../services/ai-column-generator';
import { ColumnFilter } from '@/components/common/ColumnFilter';
import { ColumnSortIndicator, ColumnSort, sortData } from '@/components/common/ColumnSort';
import { BulkContactCreationDialog } from '../BulkContactCreationDialog';
import { Contact } from '@/modules/crm/types';

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
  onContactsCreated?: (contacts: Contact[]) => void;
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
  isLoading = false,
  onContactsCreated
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);

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

  const handleBulkCreateContacts = () => {
    setShowBulkCreateDialog(true);
  };

  const handleContactsCreated = (contacts: Contact[]) => {
    console.log(`✅ ${contacts.length} contacts created successfully!`);
    if (onContactsCreated) {
      onContactsCreated(contacts);
    }
    // Clear selection after successful creation
    if (onRowSelection) {
      onRowSelection(new Set());
    }
  };

  // Get selected results for bulk creation
  const selectedResults = Array.from(selectedRows).map(index => results[index]);

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

          {selectedRows.size > 0 && (
            <Button
              onClick={handleBulkCreateContacts}
              size="sm"
              variant="default"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create {selectedRows.size} Contact{selectedRows.size !== 1 ? 's' : ''}
            </Button>
          )}
          
          {onAddAIColumn && (
            <Button
              onClick={onAddAIColumn}
              disabled={isAddingAIColumn}
              size="sm"
              variant="outline"
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
                  <th key={column.id} className={`text-left p-3 ${column.accessorKey === 'author' ? 'min-w-[200px]' : 'min-w-[150px]'}`}>
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
                        ) : column.accessorKey === 'cleanDescription' ? (
                          <div className="text-sm text-muted-foreground max-w-md">
                            <div className="line-clamp-2 leading-relaxed">
                              {String(value)}
                            </div>
                          </div>
                        ) : column.accessorKey === 'company' ? (
                          <div className="text-sm font-medium">
                            {String(value)}
                          </div>
                        ) : column.accessorKey === 'author' ? (
                          <div className="flex items-center space-x-3">
                            <img
                              src={result.image || result.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(String(value))}&size=40&background=6366f1&color=fff&bold=true&format=png`}
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
      </Card>

      {/* Bulk Contact Creation Dialog */}
      <BulkContactCreationDialog
        selectedResults={selectedResults}
        isOpen={showBulkCreateDialog}
        onClose={() => setShowBulkCreateDialog(false)}
        onSuccess={handleContactsCreated}
      />
    </div>
  );
}; 