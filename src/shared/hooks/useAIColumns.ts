import { useCallback } from 'react';
import { AIColumnGenerator, ColumnDef, EnrichedExaResultItem, AIColumnConfig } from '@/modules/search/services/ai-column-generator';
import { SearchState } from '@/shared/types/search';

export function useAIColumns(
  searchState: SearchState,
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>
) {
  const addAIColumn = useCallback(async (columnName: string, prompt: string) => {
    const config: AIColumnConfig = {
      columnName,
      prompt,
      maxResponseLength: 50,
      temperature: 0.7,
      includeProfileContext: true
    };

    // Validate configuration
    const validation = AIColumnGenerator.validateConfig(config);
    if (!validation.isValid) {
      console.error('Invalid AI column configuration:', validation.errors);
      return;
    }

    // Create the new column
    const newColumn = AIColumnGenerator.createColumnDefinition(config);

    // Add column to state immediately for UI feedback
    setSearchState(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn],
      isAddingAIColumn: true
    }));

    // Initialize loading states for all cells in this column
    if (searchState.results.length > 0) {
      setSearchState(prev => ({
        ...prev,
        aiProcessing: {
          ...prev.aiProcessing,
          ...Object.fromEntries(
            prev.enrichedResults.map((_, index) => [
              index,
              { ...prev.aiProcessing[index], [newColumn.id]: true }
            ])
          )
        }
      }));

      try {
        // Process each result individually with visual feedback
        const enrichedResults = [...searchState.enrichedResults];
        
        for (let i = 0; i < enrichedResults.length; i++) {
          try {
            const enrichedResult = await AIColumnGenerator.enrichSingleResult(
              enrichedResults[i],
              newColumn,
              config
            );
            
            // Update the specific result
            enrichedResults[i] = enrichedResult;
            
            // Update state with the new result and remove loading for this cell
            setSearchState(prev => ({
              ...prev,
              enrichedResults: [...enrichedResults],
              aiProcessing: {
                ...prev.aiProcessing,
                [i]: {
                  ...prev.aiProcessing[i],
                  [newColumn.id]: false
                }
              }
            }));
            
            // Small delay to make the animation visible
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error enriching result ${i}:`, error);
            // Remove loading state even on error
            setSearchState(prev => ({
              ...prev,
              aiProcessing: {
                ...prev.aiProcessing,
                [i]: {
                  ...prev.aiProcessing[i],
                  [newColumn.id]: false
                }
              }
            }));
          }
        }
        
        // Mark AI column addition as complete
        setSearchState(prev => ({
          ...prev,
          isAddingAIColumn: false
        }));
      } catch (error) {
        console.error('AI enrichment error:', error);
        // Remove the column if enrichment failed
        setSearchState(prev => ({
          ...prev,
          columns: prev.columns.filter(col => col.id !== newColumn.id),
          aiProcessing: Object.fromEntries(
            Object.entries(prev.aiProcessing).map(([key, value]) => [
              key,
              Object.fromEntries(
                Object.entries(value).filter(([colId]) => colId !== newColumn.id)
              )
            ])
          ),
          isAddingAIColumn: false
        }));
      }
    }
  }, [searchState.results, searchState.enrichedResults, setSearchState]);

  const removeColumn = useCallback((columnId: string) => {
    setSearchState(prev => {
      // Don't allow removing if it would leave less than 1 column
      if (prev.columns.length <= 1) {
        return prev;
      }

      // Find the column to remove
      const columnToRemove = prev.columns.find(col => col.id === columnId);
      if (!columnToRemove) {
        return prev;
      }

      // Remove the column from the columns array
      const newColumns = prev.columns.filter(col => col.id !== columnId);

      // Remove any filters for this column
      const newColumnFilters = prev.columnFilters.filter(filter => filter.columnId !== (columnToRemove.accessorKey || columnId));

      // Clear sort if it was on the removed column
      const newColumnSort = prev.columnSort?.columnId === (columnToRemove.accessorKey || columnId) ? null : prev.columnSort;

      // Remove the column data from enriched results if it's an AI-generated column
      let newEnrichedResults = prev.enrichedResults;
      if (columnToRemove.type === 'ai-generated' && columnToRemove.accessorKey) {
        newEnrichedResults = prev.enrichedResults.map(result => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [columnToRemove.accessorKey!]: _, ...rest } = result;
          return rest as EnrichedExaResultItem;
        });
      }

      return {
        ...prev,
        columns: newColumns,
        columnFilters: newColumnFilters,
        columnSort: newColumnSort,
        enrichedResults: newEnrichedResults,
        selectedRows: new Set() // Clear selection when columns change
      };
    });
  }, [setSearchState]);

  const isCellProcessing = useCallback((resultIndex: number, columnId: string): boolean => {
    return searchState.aiProcessing[resultIndex]?.[columnId] || false;
  }, [searchState.aiProcessing]);

  return {
    addAIColumn,
    removeColumn,
    isCellProcessing
  };
} 