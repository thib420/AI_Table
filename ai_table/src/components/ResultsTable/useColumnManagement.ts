import { useState, useCallback } from 'react';
import { ColumnDef, EnrichedExaResultItem } from './types';
import { stableInitialAllAvailableColumns } from './columnDefinitions';

export function useColumnManagement(
  initialVisibleColumns: ColumnDef[],
  // Parameters for fetch functions removed
) {
  const [availableColumns, setAvailableColumns] = useState<ColumnDef[]>(stableInitialAllAvailableColumns);
  const [columns, setColumns] = useState<ColumnDef[]>(initialVisibleColumns);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");

  const toggleColumnVisibility = useCallback((columnId: string) => {
    const isColumnVisible = columns.some(col => col.id === columnId);
    
    if (isColumnVisible) {
      if (columns.length <= 1) return;
      setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId));
    } else {
      const columnToAdd = availableColumns.find(col => col.id === columnId);
      if (columnToAdd) {
        setColumns(prevColumns => [...prevColumns, columnToAdd]);
        // Data fetching calls removed from here
      }
    }
  }, [columns, availableColumns]); // Dependencies simplified

  const handleCreateCustomColumn = useCallback(() => {
    if (!newColumnName.trim()) return;

    const columnId = newColumnName.trim().toLowerCase().replace(/\s+/g, '_');
    if (availableColumns.some(col => col.id === columnId)) {
      console.warn(`Column with ID ${columnId} already exists.`);
      setNewColumnName("");
      return;
    }

    const newColumn: ColumnDef = {
      id: columnId,
      header: newColumnName.trim(),
      accessorKey: (item) => {
        if (item.isFetchingCustomData && item.isFetchingCustomData[columnId]) return "Loading...";
        return (item.customData && item.customData[columnId]) || 'N/A';
      },
      width: 'w-[120px]',
      currentWidth: 120,
    };

    setAvailableColumns(prev => [...prev, newColumn]);
    setColumns(prev => [...prev, newColumn]);
    setNewColumnName("");
    // Data fetching calls removed from here
  }, [newColumnName, availableColumns]); // Dependencies simplified

  const handleDragStart = useCallback((e: React.DragEvent<HTMLTableCellElement>, columnId: string) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.setData('text/plain', columnId);
    if (e.currentTarget.parentElement) {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.5';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLTableCellElement>, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;
    
    setColumns(prevColumns => {
      const newCols = [...prevColumns];
      const draggedColumnIndex = newCols.findIndex(col => col.id === draggedColumnId);
      const targetColumnIndex = newCols.findIndex(col => col.id === targetColumnId);
      if (draggedColumnIndex !== -1 && targetColumnIndex !== -1) {
        const [draggedColumn] = newCols.splice(draggedColumnIndex, 1);
        newCols.splice(targetColumnIndex, 0, draggedColumn);
      }
      return newCols;
    });
    setDraggedColumnId(null);
  }, [draggedColumnId]);

  return {
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
  };
} 