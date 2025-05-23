"use client";

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface ColumnSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

interface ColumnSortProps {
  columnId: string;
  currentSort?: ColumnSort;
  onSortChange: (sort: ColumnSort | null) => void;
}

export function ColumnSortIndicator({ columnId, currentSort, onSortChange }: ColumnSortProps) {
  const isActive = currentSort?.columnId === columnId;
  const direction = currentSort?.direction;

  const handleClick = () => {
    if (!isActive) {
      // First click: sort ascending
      onSortChange({ columnId, direction: 'asc' });
    } else if (direction === 'asc') {
      // Second click: sort descending
      onSortChange({ columnId, direction: 'desc' });
    } else {
      // Third click: remove sort
      onSortChange(null);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
      title={
        !isActive 
          ? 'Click to sort ascending' 
          : direction === 'asc' 
            ? 'Click to sort descending' 
            : 'Click to remove sort'
      }
    >
      {!isActive ? (
        <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
      ) : direction === 'asc' ? (
        <ChevronUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
      ) : (
        <ChevronDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
      )}
    </button>
  );
}

// Utility function to sort data
export function sortData<T>(
  data: T[], 
  sort: ColumnSort | null, 
  getValueFn: (item: T, columnId: string) => unknown
): T[] {
  if (!sort) return data;

  return [...data].sort((a, b) => {
    const aValue = getValueFn(a, sort.columnId);
    const bValue = getValueFn(b, sort.columnId);

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sort.direction === 'asc' ? 1 : -1;
    if (bValue == null) return sort.direction === 'asc' ? -1 : 1;

    // Convert to strings for comparison
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    // Check if values are numeric
    const aNum = parseFloat(aStr);
    const bNum = parseFloat(bStr);
    const isNumeric = !isNaN(aNum) && !isNaN(bNum);

    let comparison = 0;
    if (isNumeric) {
      comparison = aNum - bNum;
    } else {
      comparison = aStr.localeCompare(bStr);
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
} 