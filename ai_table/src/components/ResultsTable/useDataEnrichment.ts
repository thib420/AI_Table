import { useState, useCallback, useEffect } from 'react';
import { ExaResultItem } from "@/types/exa";
import { ColumnDef, EnrichedExaResultItem } from './types';
import { stableInitialAllAvailableColumns } from './columnDefinitions';
import { getCustomColumnPrompt } from './enrichmentPrompts';

export function useDataEnrichment(results: ExaResultItem[], columns: ColumnDef[]) {
  const [enrichedResults, setEnrichedResults] = useState<EnrichedExaResultItem[]>(
    results.map(item => ({
      ...item,
      location: undefined,
      isFetchingLocation: false,
      profileImageUrl: undefined,
      isFetchingProfileImage: false,
      customData: {},
      isFetchingCustomData: {},
    }))
  );

  const fetchLocationForRow = useCallback(async (itemId: string, itemForPrompt: ExaResultItem) => {
    const promptParts = [
      `Based on the following information, what is the likely location (city, country) of this person or entity?`,
      itemForPrompt.title ? `Title: ${itemForPrompt.title}` : null,
      itemForPrompt.author ? `Name: ${itemForPrompt.author}` : null,
      itemForPrompt.text ? `Snippet: ${itemForPrompt.text.substring(0, 200)}` : null,
      itemForPrompt.url ? `URL: ${itemForPrompt.url}` : null,
      `Please provide only the location (e.g., "San Francisco, CA" or "London, UK"). If the location cannot be determined, respond with "N/A".`
    ].filter(Boolean); 
    const prompt = promptParts.join('\n');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setEnrichedResults(prev =>
        prev.map(r => {
          if (r.id === itemId) {
            return {
              ...r,
              location: data.text || 'Error fetching',
              isFetchingLocation: false,
            };
          }
          return r;
        })
      );
    } catch (error) {
      console.error('Failed to fetch location:', error);
      setEnrichedResults(prev =>
        prev.map(r => {
          if (r.id === itemId) {
            return {
              ...r,
              location: 'Error',
              isFetchingLocation: false,
            };
          }
          return r;
        })
      );
    }
  }, []);

  const fetchDataForCustomColumn = useCallback(async (itemId: string, columnDef: ColumnDef, itemForPrompt: ExaResultItem) => {
    // Generate the prompt using the new helper function
    const prompt = getCustomColumnPrompt(columnDef, itemForPrompt);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setEnrichedResults(prev =>
        prev.map(r => {
          if (r.id === itemId) {
            return {
              ...r,
              customData: {
                ...(r.customData || {}),
                [columnDef.id]: data.text || 'Error fetching',
              },
              isFetchingCustomData: {
                ...(r.isFetchingCustomData || {}),
                [columnDef.id]: false,
              },
            };
          }
          return r;
        })
      );
    } catch (error) {
      console.error(`Failed to fetch data for column ${columnDef.header}:`, error);
      setEnrichedResults(prev =>
        prev.map(r => {
          if (r.id === itemId) {
            return {
              ...r,
              customData: {
                ...(r.customData || {}),
                [columnDef.id]: 'Error',
              },
              isFetchingCustomData: {
                ...(r.isFetchingCustomData || {}),
                [columnDef.id]: false,
              },
            };
          }
          return r;
        })
      );
    }
  }, []);

  const fetchProfileImageForRow = useCallback(async (itemId: string, itemData: ExaResultItem) => {
    console.log(`Simulating profile image fetch for item ${itemId} using URL: ${itemData.url}`);
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));
    const simulatedImageUrl = undefined;

    setEnrichedResults(prev =>
      prev.map(r => {
        if (r.id === itemId) {
          return {
            ...r,
            profileImageUrl: simulatedImageUrl, 
            isFetchingProfileImage: false,
          };
        }
        return r;
      })
    );
  }, []);

  const fetchRewrittenPositionForRow = useCallback(async (itemId: string, originalTitle: string | undefined, itemForContext: ExaResultItem) => {
    if (!originalTitle) {
      setEnrichedResults(prev =>
        prev.map(r => (r.id === itemId ? { ...r, rewrittenPosition: 'N/A', isFetchingRewrittenPosition: false } : r))
      );
      return;
    }

    const prompt = `The current job title is "${originalTitle}". Please rewrite this job title to be clearer, more standardized, or more descriptive if appropriate. 
Consider the following context if available:
Author: ${itemForContext.author || 'N/A'}
URL: ${itemForContext.url || 'N/A'}
Snippet: ${itemForContext.text ? itemForContext.text.substring(0,200) : 'N/A'}
If the title is already good, you can return it as is or with minimal corrections. Provide only the rewritten job title.`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setEnrichedResults(prev =>
        prev.map(r => {
          if (r.id === itemId) {
            return {
              ...r,
              rewrittenPosition: data.text || originalTitle, // Fallback to original if API gives empty response
              isFetchingRewrittenPosition: false,
            };
          }
          return r;
        })
      );
    } catch (error) {
      console.error('Failed to fetch rewritten position:', error);
      setEnrichedResults(prev =>
        prev.map(r => {
          if (r.id === itemId) {
            return {
              ...r,
              rewrittenPosition: originalTitle, // Fallback to original on error
              isFetchingRewrittenPosition: false,
            };
          }
          return r;
        })
      );
    }
  }, []);

  useEffect(() => {
    setEnrichedResults(currentEnrichedResults => {
      const fetchesToInitiate: { itemId: string, columnDef?: ColumnDef, type: 'location' | 'custom' | 'profileImage' | 'rewrittenPosition', itemData: ExaResultItem, originalTitle?: string }[] = [];

      const updatedEnrichedResults = results.map(propItem => {
        const existingEnrichedItem = currentEnrichedResults.find(er => er.id === propItem.id);
        let baseItem: EnrichedExaResultItem;

        if (existingEnrichedItem) {
          baseItem = { 
            ...propItem,
            ...existingEnrichedItem,
            id: propItem.id,
            url: propItem.url,
            title: propItem.title,
            author: propItem.author,
            score: propItem.score,
            publishedDate: propItem.publishedDate,
            text: propItem.text,
            isFetchingLocation: existingEnrichedItem.isFetchingLocation || false,
            isFetchingProfileImage: existingEnrichedItem.isFetchingProfileImage || false,
            isFetchingCustomData: existingEnrichedItem.isFetchingCustomData ? existingEnrichedItem.isFetchingCustomData : {},
            isFetchingRewrittenPosition: existingEnrichedItem.isFetchingRewrittenPosition || false,
            rewrittenPosition: existingEnrichedItem.rewrittenPosition,
          };
        } else {
          baseItem = {
            ...propItem,
            location: undefined,
            isFetchingLocation: false,
            profileImageUrl: undefined,
            isFetchingProfileImage: false,
            customData: {},
            isFetchingCustomData: {},
            rewrittenPosition: undefined,
            isFetchingRewrittenPosition: false,
          };
        }

        if (columns.some(c => c.id === 'author') && !baseItem.profileImageUrl && !baseItem.isFetchingProfileImage) {
          baseItem.isFetchingProfileImage = true;
          fetchesToInitiate.push({ itemId: propItem.id, type: 'profileImage', itemData: propItem });
        }

        if (columns.some(c => c.id === 'title') && baseItem.title && baseItem.rewrittenPosition === undefined && !baseItem.isFetchingRewrittenPosition) {
          baseItem.isFetchingRewrittenPosition = true;
          fetchesToInitiate.push({ itemId: propItem.id, type: 'rewrittenPosition', itemData: propItem, originalTitle: baseItem.title });
        }

        columns.forEach(visibleColumn => {
          const columnId = visibleColumn.id;
          if (columnId === 'location') {
            if (baseItem.location === undefined && !baseItem.isFetchingLocation) {
              baseItem.isFetchingLocation = true;
              fetchesToInitiate.push({ itemId: propItem.id, type: 'location', itemData: propItem });
            }
          } else {
            const isPredefinedGeminiColumn = stableInitialAllAvailableColumns.some(c => c.id === columnId && ['company', 'workEmail', 'totalExperience', 'aiInsight'].includes(c.id));
            const isUserCreatedCustomColumn = !stableInitialAllAvailableColumns.some(c => c.id === columnId);
            
            if (isPredefinedGeminiColumn || isUserCreatedCustomColumn) {
              const needsData = !(baseItem.customData && baseItem.customData[columnId] !== undefined);
              const notCurrentlyFetching = !(baseItem.isFetchingCustomData && baseItem.isFetchingCustomData[columnId]);

              if (needsData && notCurrentlyFetching) {
                if (!baseItem.isFetchingCustomData) baseItem.isFetchingCustomData = {};
                baseItem.isFetchingCustomData[columnId] = true;
                fetchesToInitiate.push({ itemId: propItem.id, type: 'custom', columnDef: visibleColumn, itemData: propItem });
              }
            }
          }
        });
        return baseItem;
      });

      fetchesToInitiate.forEach(task => {
        if (task.type === 'location') {
          fetchLocationForRow(task.itemId, task.itemData);
        } else if (task.type === 'custom' && task.columnDef) {
          fetchDataForCustomColumn(task.itemId, task.columnDef, task.itemData);
        } else if (task.type === 'profileImage') {
          fetchProfileImageForRow(task.itemId, task.itemData);
        } else if (task.type === 'rewrittenPosition' && task.originalTitle) {
          fetchRewrittenPositionForRow(task.itemId, task.originalTitle, task.itemData);
        }
      });
      return updatedEnrichedResults;
    });
  }, [results, columns, fetchLocationForRow, fetchDataForCustomColumn, fetchProfileImageForRow, fetchRewrittenPositionForRow]);

  return { enrichedResults, setEnrichedResults, fetchLocationForRow, fetchDataForCustomColumn };
} 