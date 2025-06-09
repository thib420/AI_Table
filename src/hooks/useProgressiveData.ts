import { useState, useEffect, useCallback } from 'react';
import { dataService, UnifiedData } from '@/services/DataService';

export interface ProgressiveDataHook {
  // Data
  emails: UnifiedData['emails'];
  contacts: UnifiedData['contacts'];
  meetings: UnifiedData['meetings'];
  folders: UnifiedData['folders'];
  
  // Loading state
  isLoading: boolean;
  loadingProgress: UnifiedData['loadingProgress'];
  
  // Actions
  loadMoreWeeks: (weeks?: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Status
  lastSync: Date | null;
  isInitialized: boolean;
}

export function useProgressiveData(userId?: string): ProgressiveDataHook {
  const [data, setData] = useState<UnifiedData>({
    emails: [],
    contacts: [],
    meetings: [],
    folders: [],
    isLoading: false,
    lastSync: null,
    loadingProgress: {
      weeksLoaded: 0,
      totalWeeks: 0,
      currentWeek: '',
      isLoadingWeek: false,
      hasMoreData: true
    }
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize service when userId is available
  useEffect(() => {
    let mounted = true;

    async function initializeService() {
      if (!userId) return;

      try {
        await dataService.initialize(userId);
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize data service:', error);
      }
    }

    initializeService();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // Subscribe to data updates
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = dataService.subscribe('progressive-data-hook', (newData) => {
      setData(newData);
    });

    // Initial data load
    dataService.getData().catch(console.error);

    return unsubscribe;
  }, [isInitialized]);

  const loadMoreWeeks = useCallback(async (weeks: number = 4) => {
    try {
      await dataService.loadMoreWeeks(weeks);
    } catch (error) {
      console.error('Failed to load more weeks:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      await dataService.getData(true);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await dataService.clearCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  return {
    // Data
    emails: data.emails,
    contacts: data.contacts,
    meetings: data.meetings,
    folders: data.folders,
    
    // Loading state
    isLoading: data.isLoading,
    loadingProgress: data.loadingProgress,
    
    // Actions
    loadMoreWeeks,
    refresh,
    clearCache,
    
    // Status
    lastSync: data.lastSync,
    isInitialized
  };
}

// Helper hook for components that only need specific data types
export function useProgressiveEmails(userId?: string) {
  const { emails, isLoading, loadingProgress, loadMoreWeeks, refresh } = useProgressiveData(userId);
  
  return {
    emails,
    isLoading: isLoading || loadingProgress.isLoadingWeek,
    loadingProgress,
    loadMoreWeeks,
    refresh,
    hasMoreData: loadingProgress.hasMoreData
  };
}

export function useProgressiveContacts(userId?: string) {
  const { contacts, isLoading, refresh } = useProgressiveData(userId);
  
  return {
    contacts,
    isLoading,
    refresh
  };
}

export function useProgressiveMeetings(userId?: string) {
  const { meetings, isLoading, loadingProgress, loadMoreWeeks, refresh } = useProgressiveData(userId);
  
  return {
    meetings,
    isLoading: isLoading || loadingProgress.isLoadingWeek,
    loadingProgress,
    loadMoreWeeks,
    refresh,
    hasMoreData: loadingProgress.hasMoreData
  };
} 