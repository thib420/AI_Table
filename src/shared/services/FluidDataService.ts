import { persistentUnifiedDataService } from './PersistentUnifiedDataService';
import type { Email, Contact, Meeting, CRMContact, MailboxFolder } from '@/shared/types/unified-data';

interface FluidData {
  emails: Email[];
  contacts: CRMContact[];
  meetings: Meeting[];
  folders: MailboxFolder[];
  isLoading: boolean;
  lastSync: Date | null;
  isCacheStale: boolean;
}

interface PrefetchConfig {
  emails: boolean;
  contacts: boolean;
  meetings: boolean;
  folders: boolean;
}

type DataSubscriber = (data: FluidData) => void;

/**
 * Fluid Data Service - Optimized for instant navigation and fluid UX
 * 
 * Features:
 * - Instant data availability through aggressive caching
 * - Smart prefetching based on user navigation patterns
 * - Background sync without blocking UI
 * - Stale-while-revalidate strategy
 * - Module-specific data preloading
 */
export class FluidDataService {
  private subscribers = new Map<string, DataSubscriber>();
  private currentData: FluidData = {
    emails: [],
    contacts: [],
    meetings: [],
    folders: [],
    isLoading: false,
    lastSync: null,
    isCacheStale: false
  };
  
  private navigationHistory: string[] = [];
  private prefetchConfig: PrefetchConfig = {
    emails: true,
    contacts: true,
    meetings: true,
    folders: true
  };
  
  private backgroundSyncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private userId: string | null = null;

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.userId === userId) return;
    
    this.userId = userId;
    console.log('🚀 FluidDataService: Initializing for user:', userId);
    
    // Initialize persistent service
    await persistentUnifiedDataService.initialize(userId);
    
    // Subscribe to persistent data updates
    persistentUnifiedDataService.subscribe('fluid-service', (data) => {
      this.handlePersistentDataUpdate(data);
    });
    
    // Start background sync
    this.startBackgroundSync();
    
    this.isInitialized = true;
    console.log('✅ FluidDataService: Initialized');
  }

  subscribe(subscriberId: string, callback: DataSubscriber): () => void {
    this.subscribers.set(subscriberId, callback);
    console.log(`📡 FluidDataService: ${subscriberId} subscribed`);
    
    // Immediately provide current data
    callback(this.currentData);
    
    return () => {
      this.subscribers.delete(subscriberId);
      console.log(`📡 FluidDataService: ${subscriberId} unsubscribed`);
    };
  }

  /**
   * Get data with instant availability and background refresh
   */
  async getData(module?: string, forceRefresh = false): Promise<FluidData> {
    if (!this.isInitialized) {
      console.warn('⚠️ FluidDataService: Not initialized');
      return this.currentData;
    }

    // Track navigation for prefetching
    if (module) {
      this.trackNavigation(module);
    }

    // If we have cached data and it's not stale, return immediately
    if (!forceRefresh && this.hasFreshData()) {
      console.log('⚡ FluidDataService: Returning cached data instantly');
      
      // Trigger background refresh if data is getting stale
      if (this.shouldBackgroundRefresh()) {
        this.backgroundRefresh();
      }
      
      return this.currentData;
    }

    // For fresh requests or force refresh, load from persistent service
    console.log('🔄 FluidDataService: Loading data...');
    this.currentData.isLoading = true;
    this.notifySubscribers();

    try {
      await persistentUnifiedDataService.getData(forceRefresh);
      return this.currentData;
    } catch (error) {
      console.error('❌ FluidDataService: Failed to get data:', error);
      this.currentData.isLoading = false;
      this.notifySubscribers();
      return this.currentData;
    }
  }

  /**
   * Prefetch data for likely next navigation
   */
  prefetchForModule(module: string): void {
    if (!this.isInitialized) return;

    console.log(`🔮 FluidDataService: Prefetching for ${module} module`);
    
    const prefetchActions = {
      'mailbox': () => this.prefetchMailboxData(),
      'crm': () => this.prefetchCRMData(),
      'campaigns': () => this.prefetchCampaignData(),
      'ai-table': () => this.prefetchSearchData()
    };

    const action = prefetchActions[module as keyof typeof prefetchActions];
    if (action) {
      action();
    }
  }

  /**
   * Module-specific prefetch strategies
   */
  private async prefetchMailboxData(): Promise<void> {
    // Mailbox needs emails and folders immediately
    if (this.currentData.emails.length === 0 || this.currentData.folders.length === 0) {
      await this.backgroundRefresh();
    }
  }

  private async prefetchCRMData(): Promise<void> {
    // CRM needs contacts and recent meetings
    if (this.currentData.contacts.length === 0) {
      await this.backgroundRefresh();
    }
  }

  private async prefetchCampaignData(): Promise<void> {
    // Campaigns need contacts for targeting
    if (this.currentData.contacts.length === 0) {
      await this.backgroundRefresh();
    }
  }

  private async prefetchSearchData(): Promise<void> {
    // Search doesn't need Graph data, but might need contacts for enrichment
    // Keep minimal prefetching for search
  }

  /**
   * Smart background refresh based on data staleness
   */
  private async backgroundRefresh(): Promise<void> {
    if (this.currentData.isLoading) return;

    console.log('🔄 FluidDataService: Background refresh started');
    
    try {
      // Don't set loading state for background refresh to avoid UI disruption
      await persistentUnifiedDataService.getData(false);
    } catch (error) {
      console.error('❌ FluidDataService: Background refresh failed:', error);
    }
  }

  /**
   * Handle updates from persistent service
   */
  private handlePersistentDataUpdate(data: any): void {
    const wasLoading = this.currentData.isLoading;
    
    this.currentData = {
      emails: data.emails || [],
      contacts: data.contacts || [],
      meetings: data.meetings || [],
      folders: data.folders || [],
      isLoading: data.isLoading || false,
      lastSync: data.lastSync ? new Date(data.lastSync) : null,
      isCacheStale: this.calculateStaleness(data.lastSync)
    };

    // If loading state changed, notify immediately
    if (wasLoading !== this.currentData.isLoading) {
      this.notifySubscribers();
    } else {
      // Debounce other updates to avoid excessive re-renders
      this.debouncedNotify();
    }

    console.log('📊 FluidDataService: Data updated', {
      emails: this.currentData.emails.length,
      contacts: this.currentData.contacts.length,
      meetings: this.currentData.meetings.length,
      folders: this.currentData.folders.length,
      isLoading: this.currentData.isLoading,
      isCacheStale: this.currentData.isCacheStale
    });
  }

  /**
   * Track navigation patterns for intelligent prefetching
   */
  private trackNavigation(module: string): void {
    this.navigationHistory.push(module);
    
    // Keep only last 10 navigation events
    if (this.navigationHistory.length > 10) {
      this.navigationHistory.shift();
    }

    // Predict next likely navigation and prefetch
    this.predictAndPrefetch();
  }

  /**
   * Predict next navigation based on patterns
   */
  private predictAndPrefetch(): void {
    const recent = this.navigationHistory.slice(-3);
    
    // Common navigation patterns
    const patterns = {
      'search-to-crm': recent.includes('ai-table') && !recent.includes('crm'),
      'mailbox-to-crm': recent.includes('mailbox') && !recent.includes('crm'),
      'crm-to-campaigns': recent.includes('crm') && !recent.includes('campaigns')
    };

    if (patterns['search-to-crm'] || patterns['mailbox-to-crm']) {
      this.prefetchForModule('crm');
    } else if (patterns['crm-to-campaigns']) {
      this.prefetchForModule('campaigns');
    }
  }

  /**
   * Start background sync timer for data freshness
   */
  private startBackgroundSync(): void {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
    }

    // Background sync every 5 minutes
    this.backgroundSyncTimer = setInterval(() => {
      if (this.shouldBackgroundRefresh()) {
        this.backgroundRefresh();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Helper methods
   */
  private hasFreshData(): boolean {
    return this.currentData.emails.length > 0 || 
           this.currentData.contacts.length > 0 || 
           this.currentData.folders.length > 0;
  }

  private shouldBackgroundRefresh(): boolean {
    if (!this.currentData.lastSync) return true;
    
    const now = new Date();
    const timeSinceSync = now.getTime() - this.currentData.lastSync.getTime();
    
    // Refresh if data is older than 10 minutes
    return timeSinceSync > 10 * 60 * 1000;
  }

  private calculateStaleness(lastSync: string | null): boolean {
    if (!lastSync) return true;
    
    const now = new Date();
    const syncTime = new Date(lastSync);
    const timeSinceSync = now.getTime() - syncTime.getTime();
    
    // Consider stale if older than 5 minutes
    return timeSinceSync > 5 * 60 * 1000;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback, subscriberId) => {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error(`❌ Error notifying subscriber ${subscriberId}:`, error);
      }
    });
  }

  private debouncedNotifyTimeout: NodeJS.Timeout | null = null;
  
  private debouncedNotify(): void {
    if (this.debouncedNotifyTimeout) {
      clearTimeout(this.debouncedNotifyTimeout);
    }
    
    this.debouncedNotifyTimeout = setTimeout(() => {
      this.notifySubscribers();
    }, 100);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = null;
    }
    
    if (this.debouncedNotifyTimeout) {
      clearTimeout(this.debouncedNotifyTimeout);
      this.debouncedNotifyTimeout = null;
    }
    
    this.subscribers.clear();
    console.log('🧹 FluidDataService: Cleaned up');
  }

  /**
   * Clear cache and force fresh load
   */
  async clearCache(): Promise<void> {
    await persistentUnifiedDataService.clearCache();
    this.currentData = {
      emails: [],
      contacts: [],
      meetings: [],
      folders: [],
      isLoading: false,
      lastSync: null,
      isCacheStale: false
    };
    this.notifySubscribers();
  }

  /**
   * Get specific data types with optimized loading
   */
  async getEmails(refresh = false): Promise<Email[]> {
    await this.getData('mailbox', refresh);
    return this.currentData.emails;
  }

  async getContacts(refresh = false): Promise<CRMContact[]> {
    await this.getData('crm', refresh);
    return this.currentData.contacts;
  }

  async getFolders(refresh = false): Promise<MailboxFolder[]> {
    await this.getData('mailbox', refresh);
    return this.currentData.folders;
  }

  async getMeetings(refresh = false): Promise<Meeting[]> {
    await this.getData('crm', refresh);
    return this.currentData.meetings;
  }
}

export const fluidDataService = new FluidDataService();