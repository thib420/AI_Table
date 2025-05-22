"use client";

import React, { useState, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export interface ColumnFilter {
  columnId: string;
  type: 'text' | 'select' | 'contains' | 'startsWith' | 'endsWith';
  value: string | string[];
  operator?: 'and' | 'or';
}

interface ColumnFilterProps {
  columnId: string;
  columnHeader: string;
  data: any[];
  accessorKey: string;
  currentFilter?: ColumnFilter;
  onFilterChange: (filter: ColumnFilter | null) => void;
}

export function ColumnFilterComponent({ 
  columnId, 
  columnHeader, 
  data, 
  accessorKey, 
  currentFilter, 
  onFilterChange 
}: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<ColumnFilter['type']>(currentFilter?.type || 'contains');
  const [filterValue, setFilterValue] = useState<string>(
    Array.isArray(currentFilter?.value) ? currentFilter.value.join(', ') : (currentFilter?.value || '')
  );

  // Get unique values for select filter
  const uniqueValues = React.useMemo(() => {
    const values = data
      .map(item => item[accessorKey])
      .filter(value => value && value !== 'N/A' && value.toString().trim() !== '')
      .map(value => value.toString());
    return [...new Set(values)].sort();
  }, [data, accessorKey]);

  const handleApplyFilter = () => {
    if (!filterValue.trim()) {
      onFilterChange(null);
    } else {
      const filter: ColumnFilter = {
        columnId,
        type: filterType,
        value: filterType === 'select' ? filterValue.split(',').map(v => v.trim()) : filterValue,
      };
      onFilterChange(filter);
    }
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setFilterValue('');
    onFilterChange(null);
    setIsOpen(false);
  };

  const handleSelectValue = (value: string) => {
    const currentValues = filterValue ? filterValue.split(',').map(v => v.trim()) : [];
    if (currentValues.includes(value)) {
      const newValues = currentValues.filter(v => v !== value);
      setFilterValue(newValues.join(', '));
    } else {
      setFilterValue([...currentValues, value].join(', '));
    }
  };

  const isFiltered = currentFilter && currentFilter.value && 
    (Array.isArray(currentFilter.value) ? currentFilter.value.length > 0 : currentFilter.value.toString().trim() !== '');

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-muted ${isFiltered ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter {columnHeader}</h4>
            {isFiltered && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
          </div>

          {/* Filter Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Filter Type</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  {filterType === 'contains' && 'Contains'}
                  {filterType === 'text' && 'Exact Match'}
                  {filterType === 'startsWith' && 'Starts With'}
                  {filterType === 'endsWith' && 'Ends With'}
                  {filterType === 'select' && 'Select Values'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType('contains')}>
                  Contains
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('text')}>
                  Exact Match
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('startsWith')}>
                  Starts With
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('endsWith')}>
                  Ends With
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterType('select')}>
                  Select Values
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filter Input */}
          {filterType !== 'select' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Filter Value</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Filter ${columnHeader.toLowerCase()}...`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="pl-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyFilter();
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Select Values ({uniqueValues.length} options)
              </label>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {uniqueValues.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No values available
                  </div>
                ) : (
                  uniqueValues.map((value) => {
                    const isSelected = filterValue.split(',').map(v => v.trim()).includes(value);
                    return (
                      <div
                        key={value}
                        className={`p-2 cursor-pointer hover:bg-muted text-sm border-b last:border-b-0 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : ''
                        }`}
                        onClick={() => handleSelectValue(value)}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <span className="truncate">{value}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {filterValue && (
                <div className="text-xs text-muted-foreground">
                  Selected: {filterValue.split(',').filter(v => v.trim()).length} values
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button onClick={handleApplyFilter} size="sm" className="flex-1">
              Apply Filter
            </Button>
            <Button onClick={handleClearFilter} variant="outline" size="sm" className="flex-1">
              Clear
            </Button>
          </div>

          {/* Current Filter Display */}
          {isFiltered && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">Current Filter:</div>
              <div className="text-xs bg-muted p-2 rounded">
                <span className="font-medium">{filterType}</span>: {
                  Array.isArray(currentFilter?.value) 
                    ? currentFilter.value.join(', ')
                    : currentFilter?.value
                }
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 