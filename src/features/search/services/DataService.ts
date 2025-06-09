import { supabase } from '@/lib/supabase/client';
// import { graphServiceManager } from './microsoft-graph/GraphServiceManager';
import type { Email, CRMContact, Meeting, MailboxFolder } from '@/types/unified-data';

// Unified data structure
export interface UnifiedData {
  emails: Email[];
  contacts: CRMContact[];
  meetings: Meeting[];
  folders: MailboxFolder[];
  isLoading: boolean;
  lastSync: Date | null;
  loadingProgress: {
    weeksLoaded: number;
    totalWeeks: number;
    currentWeek: string; // "2024-W12" format
    isLoadingWeek: boolean;
    hasMoreData: boolean;
  };
}

// Configuration interface
export interface DataServiceConfig {
  persistent: boolean;
  cacheTimeout: number; // in milliseconds
  maxRetries: number;
  weeksToLoadInitially: number; // Default: 2 weeks of recent data
  maxWeeksToLoad: number; // Default: 26 weeks (6 months)
  autoLoadOlderData: boolean; // Default: true (background loading)
}

// Storage adapter interface
interface StorageAdapter {
  loadEmails(userId: string): Promise<Email[]>;
  loadContacts(userId: string): Promise<CRMContact[]>;
  loadMeetings(userId: string): Promise<Meeting[]>;
  loadFolders(userId: string): Promise<MailboxFolder[]>;
  saveEmails(userId: string, emails: any[]): Promise<void>;
  saveContacts(userId: string, contacts: any[]): Promise<void>;
  saveMeetings(userId: string, meetings: any[]): Promise<void>;
  saveFolders(userId: string, folders: any[]): Promise<void>;
  getSyncStatus(userId: string): Promise<SyncStatus | null>;
  updateSyncStatus(userId: string, status: Partial<SyncStatus>): Promise<void>;
  clear(userId: string): Promise<void>;
}

// Sync status interface
interface SyncStatus {
  user_id: string;
  last_emails_sync: string | null;
  last_contacts_sync: string | null;
  last_meetings_sync: string | null;
  last_folders_sync: string | null;
  sync_enabled: boolean;
  updated_at: string;
}

// Data transformer for consistent conversions
class DataTransformer {
  static convertEmailForStorage(email: any, userId: string): any {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      graph_message_id: email.id,
      folder_id: email.parentFolderId || 'inbox',
      sender_name: email.sender?.emailAddress?.name || email.from?.emailAddress?.name || null,
      sender_email: email.sender?.emailAddress?.address || email.from?.emailAddress?.address || null,
      subject: email.subject || null,
      body_preview: email.bodyPreview || null,
      received_date_time: email.receivedDateTime || new Date().toISOString(),
      is_read: email.isRead || false,
      is_flagged: email.flag?.flagStatus === 'flagged',
      has_attachments: email.hasAttachments || false,
      importance: email.importance || 'normal',
      web_link: email.webLink || null,
      raw_data: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static convertStoredEmailToEmail(stored: any): Email {
    return {
      id: stored.graph_message_id,
      sender: stored.sender_name || 'Unknown Sender',
      senderEmail: stored.sender_email || '',
      subject: stored.subject || '(No Subject)',
      preview: stored.body_preview || '',
      timestamp: stored.received_date_time,
      isRead: stored.is_read,
      isStarred: stored.is_flagged,
      hasAttachments: stored.has_attachments,
      folder: stored.folder_id,
      folderId: stored.folder_id,
      avatarUrl: this.getAvatarUrl(stored.sender_name || ''),
      displayTime: this.formatTimestamp(stored.received_date_time),
      webLink: stored.web_link,
      graphMessage: stored.raw_data
    };
  }

  static convertContactForStorage(contact: any, userId: string): any {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      graph_contact_id: contact.id,
      name: contact.displayName || `${contact.givenName || ''} ${contact.surname || ''}`.trim() || 'Unknown',
      email: this.extractEmail(contact),
      phone: this.extractPhone(contact),
      company: contact.companyName || contact.department || null,
      position: contact.jobTitle || null,
      location: contact.officeLocation || contact.city || null,
      source: contact.source || 'contacts',
      graph_type: contact.graphType || 'contact',
      last_interaction: null,
      interaction_count: 0,
      raw_data: contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static convertStoredContactToCRMContact(stored: any): CRMContact {
    return {
      id: stored.graph_contact_id,
      name: stored.name,
      email: stored.email,
      phone: stored.phone || '',
      company: stored.company || '',
      position: stored.position || '',
      location: stored.location || '',
      status: this.deriveContactStatus(stored),
      lastContact: stored.last_interaction || stored.updated_at,
      dealValue: 0,
      avatar: this.getAvatarUrl(stored.name),
      tags: [],
      source: stored.source,
      graphType: stored.graph_type
    };
  }

  // Helper methods
  private static extractEmail(contact: any): string {
    if (contact.emailAddresses?.length > 0) return contact.emailAddresses[0]?.address || '';
    if (contact.mail) return contact.mail;
    if (contact.userPrincipalName) return contact.userPrincipalName;
    if (contact.scoredEmailAddresses?.length > 0) return contact.scoredEmailAddresses[0]?.address || '';
    return '';
  }

  private static extractPhone(contact: any): string | null {
    if (contact.mobilePhone) return contact.mobilePhone;
    if (contact.businessPhones?.length > 0) return contact.businessPhones[0];
    if (contact.phones?.length > 0) return contact.phones[0]?.number || contact.phones[0];
    return null;
  }

  private static deriveContactStatus(contact: any): string {
    if (contact.source === 'users') return 'employee';
    if (contact.source === 'people') return 'partner';
    return 'prospect';
  }

  private static getAvatarUrl(name: string): string {
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
  }

  private static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
}

// Supabase adapter for persistent storage
class SupabaseAdapter implements StorageAdapter {
  async loadEmails(userId: string): Promise<Email[]> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .order('received_date_time', { ascending: false })
      .limit(200);

    if (error) throw error;
    return data.map(DataTransformer.convertStoredEmailToEmail);
  }

  async loadContacts(userId: string): Promise<CRMContact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return data.map(stored => ({
      id: stored.graph_contact_id,
      name: stored.name,
      email: stored.email,
      phone: stored.phone || '',
      company: stored.company || '',
      position: stored.position || '',
      location: stored.location || '',
      status: this.deriveContactStatus(stored),
      lastContact: stored.last_interaction || stored.updated_at,
      dealValue: 0,
      avatar: DataTransformer.getAvatarUrl(stored.name),
      tags: [],
      source: stored.source,
      graphType: stored.graph_type
    }));
  }

  async loadMeetings(userId: string): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data.map(stored => ({
      id: stored.graph_event_id,
      subject: stored.subject,
      startTime: stored.start_time,
      endTime: stored.end_time,
      attendees: stored.attendees,
      organizerEmail: stored.organizer_email,
      location: stored.location,
      isOnlineMeeting: stored.is_online_meeting
    }));
  }

  async loadFolders(userId: string): Promise<MailboxFolder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('display_name');

    if (error) throw error;
    return data.map(stored => ({
      id: stored.folder_type || stored.graph_folder_id,
      displayName: stored.display_name,
      unreadCount: stored.unread_count,
      totalCount: stored.total_count,
      isSystemFolder: stored.is_system_folder,
      icon: this.getFolderIcon(stored.folder_type),
      graphId: stored.graph_folder_id
    }));
  }

  async saveEmails(userId: string, emails: any[]): Promise<void> {
    if (emails.length === 0) return;
    
    const emailsToStore = emails.map(email => 
      DataTransformer.convertEmailForStorage(email, userId)
    );

    const { error } = await supabase
      .from('emails')
      .upsert(emailsToStore, { onConflict: 'user_id,graph_message_id' });

    if (error) throw error;
  }

  async saveContacts(userId: string, contacts: any[]): Promise<void> {
    if (contacts.length === 0) return;
    
    const contactsToStore = contacts.map(contact => ({
      id: crypto.randomUUID(),
      user_id: userId,
      graph_contact_id: contact.id,
      name: contact.displayName || `${contact.givenName || ''} ${contact.surname || ''}`.trim() || 'Unknown',
      email: DataTransformer.extractEmail(contact),
      phone: DataTransformer.extractPhone(contact),
      company: contact.companyName || contact.department || null,
      position: contact.jobTitle || null,
      location: contact.officeLocation || contact.city || null,
      source: contact.source || 'contacts',
      graph_type: contact.graphType || 'contact',
      last_interaction: null,
      interaction_count: 0,
      raw_data: contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('contacts')
      .upsert(contactsToStore, { onConflict: 'user_id,graph_contact_id' });

    if (error) throw error;
  }

  async saveMeetings(userId: string, meetings: any[]): Promise<void> {
    if (meetings.length === 0) return;
    
    const meetingsToStore = meetings.map(meeting => ({
      id: crypto.randomUUID(),
      user_id: userId,
      graph_event_id: meeting.id,
      subject: meeting.subject || 'No Subject',
      start_time: meeting.start?.dateTime || new Date().toISOString(),
      end_time: meeting.end?.dateTime || new Date().toISOString(),
      attendees: meeting.attendees || [],
      organizer_email: meeting.organizer?.emailAddress?.address || null,
      location: meeting.location?.displayName || null,
      is_online_meeting: meeting.isOnlineMeeting || false,
      raw_data: meeting,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('meetings')
      .upsert(meetingsToStore, { onConflict: 'user_id,graph_event_id' });

    if (error) throw error;
  }

  async saveFolders(userId: string, folders: any[]): Promise<void> {
    if (folders.length === 0) return;
    
    const foldersToStore = folders.map(folder => ({
      id: crypto.randomUUID(),
      user_id: userId,
      graph_folder_id: folder.id,
      display_name: folder.displayName || 'Unknown Folder',
      unread_count: folder.unreadItemCount || 0,
      total_count: folder.totalItemCount || 0,
      folder_type: this.determineFolderType(folder.displayName),
      is_system_folder: this.isSystemFolder(folder.displayName),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('folders')
      .upsert(foldersToStore, { onConflict: 'user_id,graph_folder_id' });

    if (error) throw error;
  }

  async getSyncStatus(userId: string): Promise<SyncStatus | null> {
    const { data, error } = await supabase
      .from('user_data_sync')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async updateSyncStatus(userId: string, status: Partial<SyncStatus>): Promise<void> {
    const { error } = await supabase
      .from('user_data_sync')
      .upsert({
        user_id: userId,
        ...status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async clear(userId: string): Promise<void> {
    await Promise.allSettled([
      supabase.from('emails').delete().eq('user_id', userId),
      supabase.from('contacts').delete().eq('user_id', userId),
      supabase.from('meetings').delete().eq('user_id', userId),
      supabase.from('folders').delete().eq('user_id', userId),
      supabase.from('user_data_sync').delete().eq('user_id', userId)
    ]);
  }

  private deriveContactStatus(contact: any): string {
    if (contact.source === 'users') return 'employee';
    if (contact.source === 'people') return 'partner';
    return 'prospect';
  }

  private determineFolderType(displayName: string): string {
    const name = displayName.toLowerCase();
    if (name === 'inbox') return 'inbox';
    if (name === 'sent items') return 'sent';
    if (name === 'drafts') return 'drafts';
    if (name === 'deleted items') return 'deletedItems';
    if (name === 'junk email') return 'junk';
    return 'custom';
  }

  private isSystemFolder(displayName: string): boolean {
    const systemNames = ['inbox', 'sent items', 'drafts', 'deleted items', 'junk email', 'outbox'];
    return systemNames.includes(displayName.toLowerCase());
  }

  private getFolderIcon(folderType: string): string {
    switch (folderType) {
      case 'inbox': return 'Inbox';
      case 'sent': return 'Send';
      case 'drafts': return 'Mail';
      case 'deletedItems': return 'Trash';
      default: return 'Folder';
    }
  }
}

// Main unified data service
export class DataService {
  private adapter: StorageAdapter;
  private subscribers = new Map<string, (data: UnifiedData) => void>();
  private currentData: UnifiedData = {
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
  };
  private userId: string | null = null;
  private config: DataServiceConfig;

  constructor(config: DataServiceConfig) {
    this.config = config;
    this.adapter = config.persistent 
      ? new SupabaseAdapter()
      : new (class InMemoryAdapter implements StorageAdapter {
          private data: { [userId: string]: any } = {};
          
          async loadEmails(userId: string): Promise<Email[]> { return []; }
          async loadContacts(userId: string): Promise<CRMContact[]> { return []; }
          async loadMeetings(userId: string): Promise<Meeting[]> { return []; }
          async loadFolders(userId: string): Promise<MailboxFolder[]> { return []; }
          async saveEmails(userId: string, emails: any[]): Promise<void> {}
          async saveContacts(userId: string, contacts: any[]): Promise<void> {}
          async saveMeetings(userId: string, meetings: any[]): Promise<void> {}
          async saveFolders(userId: string, folders: any[]): Promise<void> {}
          async getSyncStatus(userId: string): Promise<SyncStatus | null> { return null; }
          async updateSyncStatus(userId: string, status: Partial<SyncStatus>): Promise<void> {}
          async clear(userId: string): Promise<void> {}
        })();
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    console.log(`🚀 DataService initialized for user: ${userId} (persistent: ${this.config.persistent})`);
  }

  subscribe(subscriberId: string, callback: (data: UnifiedData) => void): () => void {
    this.subscribers.set(subscriberId, callback);
    callback(this.currentData); // Send current data immediately
    
    return () => {
      this.subscribers.delete(subscriberId);
    };
  }

  async getData(forceRefresh = false): Promise<UnifiedData> {
    if (!this.userId) {
      console.warn('⚠️ DataService not initialized');
      return this.currentData;
    }

    try {
      this.currentData.isLoading = true;
      this.notifySubscribers();

      // Load cached data first
      await this.loadCachedData();
      this.notifySubscribers();

      // Check if we need to sync
      if (forceRefresh || await this.shouldSync()) {
        await this.performSync();
        this.currentData.lastSync = new Date();
      }

      return this.currentData;
    } catch (error) {
      console.error('❌ Failed to get data:', error);
      throw error;
    } finally {
      this.currentData.isLoading = false;
      this.notifySubscribers();
    }
  }

  async clearCache(): Promise<void> {
    if (!this.userId) return;
    
    await this.adapter.clear(this.userId);
    this.currentData = {
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
    };
    this.notifySubscribers();
  }

  private async loadCachedData(): Promise<void> {
    if (!this.userId) return;

    const [emails, contacts, meetings, folders] = await Promise.allSettled([
      this.adapter.loadEmails(this.userId),
      this.adapter.loadContacts(this.userId),
      this.adapter.loadMeetings(this.userId),
      this.adapter.loadFolders(this.userId)
    ]);

    this.currentData.emails = emails.status === 'fulfilled' ? emails.value : [];
    this.currentData.contacts = contacts.status === 'fulfilled' ? contacts.value : [];
    this.currentData.meetings = meetings.status === 'fulfilled' ? meetings.value : [];
    this.currentData.folders = folders.status === 'fulfilled' ? folders.value : [];

    console.log(`📂 Loaded cached data: ${this.currentData.emails.length} emails, ${this.currentData.contacts.length} contacts`);
  }

  private async shouldSync(): Promise<boolean> {
    if (!this.userId || !this.config.persistent) return true;

    const syncStatus = await this.adapter.getSyncStatus(this.userId);
    if (!syncStatus) return true;

    const lastSync = syncStatus.last_emails_sync 
      ? new Date(syncStatus.last_emails_sync)
      : null;

    if (!lastSync) return true;

    const timeSinceSync = Date.now() - lastSync.getTime();
    return timeSinceSync > this.config.cacheTimeout;
  }

  private async performSync(): Promise<void> {
    if (!this.userId) return;

    console.log('🔄 Starting progressive data sync...');
    
    try {
      await graphServiceManager.initialize();

      // First load folders and contacts (one-time data)
      await this.loadStaticData();

      // Then load data progressively week by week
      await this.loadProgressiveData();
      
      console.log('✅ Progressive data sync completed');
    } catch (error) {
      console.error('❌ Data sync failed:', error);
      throw error;
    }
  }

  private async loadStaticData(): Promise<void> {
    console.log('📁 Loading static data (folders, contacts)...');

    // Load folders and contacts (these don't change frequently)
    const [folders, contacts, people, users] = await Promise.allSettled([
      graphServiceManager.mail.getMailFolders(),
      graphServiceManager.contacts.getContacts({ top: 200 }),
      graphServiceManager.people.getRelevantPeople({ top: 100 }),
      graphServiceManager.users.getUsers({ top: 50 })
    ]);

    // Save to storage
    await Promise.allSettled([
      folders.status === 'fulfilled' ? this.adapter.saveFolders(this.userId!, folders.value) : Promise.resolve(),
      contacts.status === 'fulfilled' ? this.adapter.saveContacts(this.userId!, contacts.value) : Promise.resolve(),
      people.status === 'fulfilled' ? this.adapter.saveContacts(this.userId!, people.value.map(p => ({ ...p, source: 'people' }))) : Promise.resolve(),
      users.status === 'fulfilled' ? this.adapter.saveContacts(this.userId!, users.value.map(u => ({ ...u, source: 'users' }))) : Promise.resolve()
    ]);

    // Update UI with contacts and folders
    await this.loadCachedData();
    this.notifySubscribers();
  }

  private async loadProgressiveData(): Promise<void> {
    const weeksToLoad = this.config.weeksToLoadInitially;
    const maxWeeks = this.config.maxWeeksToLoad;
    
    this.currentData.loadingProgress = {
      weeksLoaded: 0,
      totalWeeks: weeksToLoad,
      currentWeek: '',
      isLoadingWeek: false,
      hasMoreData: true
    };

    console.log(`📅 Loading ${weeksToLoad} weeks of recent data...`);

    // Load initial weeks (recent data first)
    for (let weekOffset = 0; weekOffset < weeksToLoad; weekOffset++) {
      await this.loadWeekData(weekOffset);
      
      if (weekOffset === 0) {
        // After first week, show data to user immediately
        await this.loadCachedData();
        this.notifySubscribers();
      }
    }

    // Background loading of older data if enabled
    if (this.config.autoLoadOlderData && weeksToLoad < maxWeeks) {
      this.loadOlderDataInBackground(weeksToLoad, maxWeeks);
    }
  }

  private async loadWeekData(weekOffset: number): Promise<void> {
    const { startDate, endDate, weekString } = this.getWeekRange(weekOffset);
    
    this.currentData.loadingProgress.isLoadingWeek = true;
    this.currentData.loadingProgress.currentWeek = weekString;
    this.notifySubscribers();

    console.log(`📧 Loading week ${weekString} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);

    try {
      // Load emails for this specific week
      const emails = await this.getEmailsForDateRange(startDate, endDate);
      
      // Load meetings for this specific week  
      const meetings = await this.getMeetingsForDateRange(startDate, endDate);

      // Save to storage
      if (emails.length > 0) {
        await this.adapter.saveEmails(this.userId!, emails);
      }
      if (meetings.length > 0) {
        await this.adapter.saveMeetings(this.userId!, meetings);
      }

      this.currentData.loadingProgress.weeksLoaded++;
      
      console.log(`✅ Week ${weekString} loaded: ${emails.length} emails, ${meetings.length} meetings`);

    } catch (error) {
      console.error(`❌ Failed to load week ${weekString}:`, error);
    } finally {
      this.currentData.loadingProgress.isLoadingWeek = false;
      this.notifySubscribers();
    }
  }

  private async loadOlderDataInBackground(startWeek: number, maxWeeks: number): Promise<void> {
    console.log(`🔄 Background loading older data (weeks ${startWeek + 1}-${maxWeeks})...`);

    // Small delay to ensure UI is responsive
    await new Promise(resolve => setTimeout(resolve, 1000));

    for (let weekOffset = startWeek; weekOffset < maxWeeks; weekOffset++) {
      await this.loadWeekData(weekOffset);
      
      // Update cache every few weeks during background loading
      if (weekOffset % 3 === 0) {
        await this.loadCachedData();
        this.notifySubscribers();
      }

      // Small delay between weeks to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.currentData.loadingProgress.hasMoreData = false;
    console.log('✅ Background data loading completed');
  }

  private getWeekRange(weekOffset: number): { startDate: Date; endDate: Date; weekString: string } {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() - (weekOffset * 7)); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    const year = startOfWeek.getFullYear();
    const weekNumber = this.getWeekNumber(startOfWeek);
    const weekString = `${year}-W${weekNumber.toString().padStart(2, '0')}`;

    return { startDate: startOfWeek, endDate: endOfWeek, weekString };
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  private async getEmailsForDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      // Microsoft Graph date filter format
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      
      const emails = await graphServiceManager.mail.getEmails('inbox', 1000, {
        filter: `receivedDateTime ge ${startIso} and receivedDateTime le ${endIso}`,
        orderby: 'receivedDateTime desc'
      });

      return emails || [];
    } catch (error) {
      console.error('Failed to fetch emails for date range:', error);
      return [];
    }
  }

  private async getMeetingsForDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      const meetings = await graphServiceManager.calendar.getEvents({
        top: 1000,
        filter: `start/dateTime ge '${startIso}' and start/dateTime le '${endIso}'`,
        orderby: 'start/dateTime desc'
      });

      return meetings || [];
    } catch (error) {
      console.error('Failed to fetch meetings for date range:', error);
      return [];
    }
  }

  async loadMoreWeeks(additionalWeeks: number = 4): Promise<void> {
    if (!this.userId || !this.currentData.loadingProgress.hasMoreData) return;

    const currentWeeks = this.currentData.loadingProgress.weeksLoaded;
    const newTotalWeeks = Math.min(currentWeeks + additionalWeeks, this.config.maxWeeksToLoad);

    console.log(`📅 Loading ${additionalWeeks} more weeks of data...`);

    this.currentData.loadingProgress.totalWeeks = newTotalWeeks;

    for (let weekOffset = currentWeeks; weekOffset < newTotalWeeks; weekOffset++) {
      await this.loadWeekData(weekOffset);
    }

    await this.loadCachedData();
    this.notifySubscribers();

    if (newTotalWeeks >= this.config.maxWeeksToLoad) {
      this.currentData.loadingProgress.hasMoreData = false;
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error('❌ Error notifying subscriber:', error);
      }
    });
  }
}

// Factory function to create configured service
export function createDataService(config: Partial<DataServiceConfig> = {}): DataService {
  const defaultConfig: DataServiceConfig = {
    persistent: process.env.NEXT_PUBLIC_USE_PERSISTENT_CACHE !== 'false',
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    weeksToLoadInitially: 2, // Load 2 weeks of recent data initially
    maxWeeksToLoad: 26, // Max 6 months of data
    autoLoadOlderData: true // Background load older data
  };

  return new DataService({ ...defaultConfig, ...config });
}

// Export singleton instance
export const dataService = createDataService(); 