import { useState, useRef, useCallback, useEffect } from 'react';
import { ColumnDef } from './types';

export function useColumnResizing(initialColumns: ColumnDef[], setColumns: React.Dispatch<React.SetStateAction<ColumnDef[]>>) {
  const [isResizing, setIsResizing] = useState(false);
  const resizingColumnIdRef = useRef<string | null>(null);
  const startXRef = useRef(0);
  const tableRef = useRef<HTMLTableElement>(null);
  const columnsRef = useRef(initialColumns);

  useEffect(() => {
    columnsRef.current = initialColumns;
  }, [initialColumns]);

  useEffect(() => {
    const handleResize = () => {
      if (!tableRef.current) return;
      
      const tableWidth = tableRef.current.getBoundingClientRect().width;
      const availableWidth = tableWidth - 12; 
      
      if (columnsRef.current.length > 0) {
        const totalCurrentWidth = columnsRef.current.reduce((sum, col) => sum + (col.currentWidth || 100), 0);
        
        if (totalCurrentWidth > availableWidth) {
          const ratio = availableWidth / totalCurrentWidth;
          
          setColumns(prev => 
            prev.map(col => ({
              ...col,
              currentWidth: Math.max(80, Math.floor((col.currentWidth || 100) * ratio))
            }))
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 
    
    return () => window.removeEventListener('resize', handleResize);
  }, [setColumns]); // Removed columnsRef.current from deps, as it's a ref

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    resizingColumnIdRef.current = columnId;
    startXRef.current = e.clientX;
  }, [setIsResizing]);
  
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumnIdRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const currentResizingId = resizingColumnIdRef.current;
    
    setColumns(prevColumns => {
      const columnIndex = prevColumns.findIndex(col => col.id === currentResizingId);
      if (columnIndex === -1) return prevColumns;

      const newColumns = [...prevColumns];
      const columnToResize = { ...newColumns[columnIndex] };
      
      const currentRegisteredWidth = columnToResize.currentWidth || parseInt(columnToResize.width.replace(/[^0-9]/g, ''), 10) || 100;
      const newWidth = Math.max(80, currentRegisteredWidth + deltaX);
      
      columnToResize.currentWidth = newWidth;
      newColumns[columnIndex] = columnToResize;
      return newColumns;
    });
    
    startXRef.current = e.clientX;
  }, [setColumns]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, [setIsResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return {
    isResizing,
    resizingColumnIdRef,
    tableRef,
    handleResizeStart,
    handleDragStartPrevent: (e: React.DragEvent<HTMLTableCellElement>) => {
        if (isResizing) {
            e.preventDefault();
        }
    }
  };
} 