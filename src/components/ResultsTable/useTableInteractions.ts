import { useState, useMemo, useCallback } from 'react';
import { EnrichedExaResultItem } from './types';
import { stableInitialAllAvailableColumns } from './columnDefinitions'; // To access accessorKey for sorting

export function useTableInteractions(enrichedResults: EnrichedExaResultItem[]) {
  const [selectedRowIds, setSelectedRowIds] = useState(new Set<string>());
  const [filterQuery, setFilterQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const handleSort = useCallback((columnId: string) => {
    if (columnId === 'url') return;

    setSortConfig(currentSortConfig => {
      if (currentSortConfig.key === columnId) {
        return {
          key: columnId,
          direction: currentSortConfig.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key: columnId, direction: 'asc' };
    });
  }, []);

  const displayedResults = useMemo(() => {
    let sortedResults = [...enrichedResults];

    if (filterQuery) {
      const lowerCaseQuery = filterQuery.toLowerCase();
      sortedResults = sortedResults.filter(item => {
        if (item.author?.toLowerCase().includes(lowerCaseQuery)) return true;
        if (item.title?.toLowerCase().includes(lowerCaseQuery)) return true;
        if (item.url?.toLowerCase().includes(lowerCaseQuery)) return true;
        if (item.text?.toLowerCase().includes(lowerCaseQuery)) return true;
        if (item.location?.toLowerCase().includes(lowerCaseQuery)) return true;
        if (item.customData) {
          for (const key in item.customData) {
            if (item.customData[key]?.toLowerCase().includes(lowerCaseQuery)) return true;
          }
        }
        return false;
      });
    }

    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      // Find the column definition from all available columns to get the accessorKey or type
      const columnToSort = stableInitialAllAvailableColumns.find(col => col.id === key);

      if (columnToSort) {
        sortedResults.sort((a, b) => {
          let valA: unknown;
          let valB: unknown;

          if (key === 'location') {
            valA = a.location;
            valB = b.location;
          } else if (key === 'score') { // 'score' is no longer a default column, but keeping logic for custom score-like columns
            valA = a.score; 
            valB = b.score;
          } else if (key === 'published') { // same for 'published'
            valA = a.publishedDate ? new Date(a.publishedDate).getTime() : null;
            valB = b.publishedDate ? new Date(b.publishedDate).getTime() : null;
          } else if (typeof columnToSort.accessorKey === 'string') {
            valA = (a as EnrichedExaResultItem)[columnToSort.accessorKey as keyof EnrichedExaResultItem];
            valB = (b as EnrichedExaResultItem)[columnToSort.accessorKey as keyof EnrichedExaResultItem];
          } else if (a.customData && b.customData && a.customData[key] !== undefined && b.customData[key] !== undefined) {
            valA = a.customData[key];
            valB = b.customData[key];
          } else {
            valA = null;
            valB = null;
          }
          
          const nA_Values = [null, undefined, "N/A", "Loading...", "Error"];
          const isValANa = nA_Values.includes(valA);
          const isValBNa = nA_Values.includes(valB);

          if (isValANa && isValBNa) return 0;
          if (isValANa) return direction === 'asc' ? 1 : -1;
          if (isValBNa) return direction === 'asc' ? -1 : 1;

          if (typeof valA === 'number' && typeof valB === 'number') {
            return direction === 'asc' ? valA - valB : valB - valA;
          } else if (typeof valA === 'string' && typeof valB === 'string') {
            return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          } else {
            const strValA = String(valA);
            const strValB = String(valB);
            return direction === 'asc' ? strValA.localeCompare(strValB) : strValB.localeCompare(strValA);
          }
        });
      }
    }
    return sortedResults;
  }, [enrichedResults, filterQuery, sortConfig]);

  const areAllCurrentRowsSelected = displayedResults.length > 0 && selectedRowIds.size === displayedResults.length && displayedResults.every(item => selectedRowIds.has(item.id));
  const isAnyRowSelected = selectedRowIds.size > 0;
  const isIndeterminate = isAnyRowSelected && !areAllCurrentRowsSelected;

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRowIds(prevSelected => {
        const newSelectedIds = new Set(prevSelected);
        displayedResults.forEach(item => newSelectedIds.add(item.id));
        return newSelectedIds;
      });
    } else {
      setSelectedRowIds(prevSelected => {
        const newSelectedIds = new Set(prevSelected);
        displayedResults.forEach(item => newSelectedIds.delete(item.id));
        return newSelectedIds;
      });
    }
  }, [displayedResults]);

  const handleRowSelect = useCallback((rowId: string, checked: boolean) => {
    setSelectedRowIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, []);

  return {
    selectedRowIds,
    filterQuery,
    setFilterQuery,
    sortConfig,
    handleSort,
    displayedResults,
    areAllCurrentRowsSelected,
    isIndeterminate,
    handleSelectAll,
    handleRowSelect,
  };
} 