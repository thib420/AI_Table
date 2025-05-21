"use client";

import React, { useMemo, useRef } from 'react';
import { ExaResultItem } from "@/types/exa";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Plus, Check, PlusCircle, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ColumnDef, ResultsTableProps, EnrichedExaResultItem } from './types';
import { stableInitialAllAvailableColumns } from './columnDefinitions';
import { useDataEnrichment } from './useDataEnrichment';
import { useColumnManagement } from './useColumnManagement';
import { useColumnResizing } from './useColumnResizing';
import { useTableInteractions } from './useTableInteractions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
  // Initial visible columns (subset of all available)
  const initialVisibleColumns = useMemo(() => stableInitialAllAvailableColumns.filter(
    col => col.id === 'author' || col.id === 'url'
  ), []);

  const {
    availableColumns,
    columns,
    setColumns,
    newColumnName,
    setNewColumnName,
    toggleColumnVisibility,
    handleCreateCustomColumn,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = useColumnManagement(initialVisibleColumns);

  // useDataEnrichment now depends on `columns` from useColumnManagement
  const {
    enrichedResults,
    // fetchLocationForRow, // Not needed directly by ResultsTable component anymore
    // fetchDataForCustomColumn // Not needed directly by ResultsTable component anymore
  } = useDataEnrichment(results, columns);

  const {
    isResizing,
    resizingColumnIdRef,
    tableRef,
    handleResizeStart,
    handleDragStartPrevent
  } = useColumnResizing(columns, setColumns);

  // useTableInteractions depends on the enrichedResults from useDataEnrichment
  const {
    filterQuery,
    setFilterQuery,
    sortConfig,
    handleSort,
    displayedResults,
    areAllCurrentRowsSelected,
    isIndeterminate,
    handleSelectAll,
    handleRowSelect,
    selectedRowIds,
  } = useTableInteractions(enrichedResults);
  
  // Removed duplicated useDataEnrichment call (dataEnrichmentOutput)

  // Define the CellContent component to handle content display with tooltips
  const CellContent = ({ content }: { content: string | React.ReactNode }) => {
    if (React.isValidElement(content) || typeof content !== 'string') {
      return <>{content}</>;
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate block">{content}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs break-words">{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const columnsRef = useRef(columns);
  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!isLoading && displayedResults.length === 0 && results.length > 0 && filterQuery) {
    return (
      <div className="space-y-4">
        <Input 
          placeholder="Filter table data..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="max-w-sm mb-4 h-9"
        />
        <div className="text-center py-10">
          <p className="text-muted-foreground">No results match your filter "{filterQuery}".</p>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No results to display. Try a new search above.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Input 
        placeholder="Filter table data..."
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        className="max-w-sm mb-4 h-9"
      />
      <div className="w-full inline-block align-top overflow-x-auto border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none rounded-md">
        <Table ref={tableRef} className="relative min-w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-5 px-1 text-center sticky left-0 bg-background z-10">#</TableHead>
              <TableHead className="w-5 px-2 sticky left-0 bg-background z-10">
                <Checkbox 
                  checked={areAllCurrentRowsSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  aria-label="Select all rows"
                  data-state={isIndeterminate ? 'indeterminate' : (areAllCurrentRowsSelected ? 'checked' : 'unchecked')}
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead 
                  key={column.id}
                  style={{ 
                    width: `${column.currentWidth || 100}px`,
                    minWidth: "80px",
                    maxWidth: column.id === 'url' ? "350px" : undefined
                  }}
                  className={cn(
                    "relative select-none group", 
                    column.id !== 'url' && "cursor-pointer hover:bg-muted/20",
                    isResizing && resizingColumnIdRef.current === column.id && "bg-muted/50"
                  )}
                  draggable={!isResizing}
                  onDragStart={(e) => {
                    handleDragStartPrevent(e);
                    if (!isResizing) handleDragStart(e, column.id);
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                  onClick={() => column.id !== 'url' && handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span>{column.header}</span>
                    {sortConfig.key === column.id && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                    {sortConfig.key !== column.id && column.id !== 'url' && <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />}
                  </div>
                  <div
                    className={cn(
                      "absolute top-0 right-0 h-full w-2 cursor-col-resize",
                      "bg-transparent group-hover:bg-muted/30",
                      isResizing && resizingColumnIdRef.current === column.id && "bg-primary/50"
                    )}
                    onMouseDown={(e) => handleResizeStart(e, column.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableHead>
              ))}
              <TableHead className="w-12 px-2 sticky right-0 bg-background">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none mb-2">Add columns</h4>
                      {availableColumns.map(column => {
                        const isVisible = columns.some(col => col.id === column.id);
                        return (
                          <div key={column.id} className="flex items-center gap-2 py-1">
                            <Checkbox 
                              id={`column-${column.id}`}
                              checked={isVisible}
                              onCheckedChange={() => toggleColumnVisibility(column.id)}
                            />
                            <label 
                              htmlFor={`column-${column.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {column.header}
                            </label>
                            {isVisible && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-2 pt-2 border-t mt-2">
                        <Input
                          type="text"
                          placeholder="New column name..."
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={handleCreateCustomColumn}
                          disabled={!newColumnName.trim()}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedResults.map((item, index) => (
              <TableRow 
                key={item.id}
                data-state={selectedRowIds.has(item.id) ? 'selected' : undefined}
                className={cn(selectedRowIds.has(item.id) && 'bg-muted/50')}
              >
                <TableCell className="w-10 px-1 text-center sticky left-0 bg-background z-10 font-medium text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="w-10 px-2 sticky left-10 bg-background z-10">
                  <Checkbox 
                    checked={selectedRowIds.has(item.id)}
                    onCheckedChange={(checked) => handleRowSelect(item.id, checked === true)}
                    aria-label={`Select row ${index + 1}`}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell 
                    key={column.id}
                    style={{ 
                      width: `${column.currentWidth || 100}px`,
                      minWidth: "80px",
                      maxWidth: column.id === 'url' ? "350px" : undefined
                    }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <CellContent 
                      content={(() => {
                        // Use enrichedResults directly from the hook for rendering cell content
                        const currentItem = enrichedResults.find(er => er.id === item.id) || item;
                        if (typeof column.accessorKey === 'function') {
                          return column.accessorKey(currentItem as EnrichedExaResultItem);
                        }
                        const typedItem = currentItem as EnrichedExaResultItem;
                        return (typedItem[column.accessorKey as keyof EnrichedExaResultItem] as string) || 'N/A';
                      })()}
                    />
                  </TableCell>
                ))}
                <TableCell className="w-12 sticky right-0 bg-background"></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 