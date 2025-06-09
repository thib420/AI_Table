import { useState, useEffect, useCallback } from 'react';
import { fluidDataService } from '@/shared/services/FluidDataService';
import type { Email, CRMContact, Meeting, MailboxFolder } from '@/shared/types/unified-data';

interface FluidDataHook {
  // Data
  emails: Email[];
  contacts: CRMContact[];
  meetings: Meeting[];
  folders: MailboxFolder[];
  
  // State
  isLoading: boolean;
  isCacheStale: boolean;
  lastSync: Date | null;
  
  // Actions
  refresh: (module?: string) => Promise<void>;
  prefetch: (module: string) => void;
  clearCache: () => Promise<void>;
  
  // Specific data getters with optimizations
  getEmails: (refresh?: boolean) => Promise<Email[]>;
  getContacts: (refresh?: boolean) => Promise<CRMContact[]>;
  getFolders: (refresh?: boolean) => Promise<MailboxFolder[]>;
  getMeetings: (refresh?: boolean) => Promise<Meeting[]>;
}

export function useFluidData(userId?: string, currentModule?: string): FluidDataHook {
  const [data, setData] = useState({
    emails: [] as Email[],
    contacts: [] as CRMContact[],
    meetings: [] as Meeting[],
    folders: [] as MailboxFolder[],
    isLoading: false,
    isCacheStale: false,
    lastSync: null as Date | null
  });

  // Initialize service
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    async function initializeService() {
      try {
        await fluidDataService.initialize(userId);
        
        if (mounted && currentModule) {
          // Prefetch data for current module
          fluidDataService.prefetchForModule(currentModule);
        }
      } catch (error) {
        console.error('Failed to initialize fluid data service:', error);
      }
    }

    initializeService();

    return () => {
      mounted = false;
    };
  }, [userId, currentModule]);

  // Subscribe to data updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = fluidDataService.subscribe('fluid-data-hook', (newData) => {
      setData(newData);
    });

    return unsubscribe;
  }, [userId]);

  // Prefetch when module changes
  useEffect(() => {
    if (currentModule && userId) {
      fluidDataService.prefetchForModule(currentModule);
    }
  }, [currentModule, userId]);

  const refresh = useCallback(async (module?: string) => {
    try {
      await fluidDataService.getData(module, true);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  const prefetch = useCallback((module: string) => {
    fluidDataService.prefetchForModule(module);
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await fluidDataService.clearCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const getEmails = useCallback(async (refresh = false) => {
    return await fluidDataService.getEmails(refresh);
  }, []);

  const getContacts = useCallback(async (refresh = false) => {
    return await fluidDataService.getContacts(refresh);
  }, []);

  const getFolders = useCallback(async (refresh = false) => {
    return await fluidDataService.getFolders(refresh);
  }, []);

  const getMeetings = useCallback(async (refresh = false) => {
    return await fluidDataService.getMeetings(refresh);
  }, []);

  return {
    // Data
    emails: data.emails,
    contacts: data.contacts,
    meetings: data.meetings,
    folders: data.folders,
    
    // State
    isLoading: data.isLoading,
    isCacheStale: data.isCacheStale,
    lastSync: data.lastSync,
    
    // Actions
    refresh,
    prefetch,
    clearCache,
    
    // Specific getters
    getEmails,
    getContacts,
    getFolders,
    getMeetings
  };
}

// Specialized hooks for specific modules
export function useFluidMailbox(userId?: string) {
  const fluidData = useFluidData(userId, 'mailbox');
  
  return {
    emails: fluidData.emails,
    folders: fluidData.folders,
    isLoading: fluidData.isLoading,
    isCacheStale: fluidData.isCacheStale,
    refresh: () => fluidData.refresh('mailbox'),
    getEmails: fluidData.getEmails,
    getFolders: fluidData.getFolders
  };
}

export function useFluidCRM(userId?: string) {
  const fluidData = useFluidData(userId, 'crm');
  
  return {
    contacts: fluidData.contacts,
    meetings: fluidData.meetings,
    emails: fluidData.emails, // CRM also needs emails for customer view
    isLoading: fluidData.isLoading,
    isCacheStale: fluidData.isCacheStale,
    refresh: () => fluidData.refresh('crm'),
    getContacts: fluidData.getContacts,
    getMeetings: fluidData.getMeetings
  };
}

export function useFluidCampaigns(userId?: string) {
  const fluidData = useFluidData(userId, 'campaigns');
  
  return {
    contacts: fluidData.contacts,
    emails: fluidData.emails,
    isLoading: fluidData.isLoading,
    refresh: () => fluidData.refresh('campaigns'),
    getContacts: fluidData.getContacts
  };
}