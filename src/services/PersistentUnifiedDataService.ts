import { supabase } from '@/lib/supabase/client';
import { graphServiceManager } from './microsoft-graph/GraphServiceManager';
import type { Email, Contact, Meeting, CRMContact, MailboxFolder } from '@/types/unified-data';

interface SyncStatus {
  id: string;
  user_id: string;
  last_emails_sync: string | null;
  last_contacts_sync: string | null;
  last_meetings_sync: string | null;
  last_folders_sync: string | null;
  sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface PersistedEmail {
  id: string;
  user_id: string;
  graph_message_id: string;
  folder_id: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  body_preview: string | null;
  received_date_time: string;
  is_read: boolean;
  is_flagged: boolean;
  has_attachments: boolean;
  importance: string;
  web_link: string | null;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

interface PersistedContact {
  id: string;
  user_id: string;
  graph_contact_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  location: string | null;
  source: 'contacts' | 'people' | 'users' | 'emails';
  graph_type: 'contact' | 'person' | 'user';
  last_interaction: string | null;
  interaction_count: number;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

interface PersistedMeeting {
  id: string;
  user_id: string;
  graph_event_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  attendees: any[];
  organizer_email: string | null;
  location: string | null;
  is_online_meeting: boolean;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

interface PersistedFolder {
  id: string;
  user_id: string;
  graph_folder_id: string;
  display_name: string;
  unread_count: number;
  total_count: number;
  folder_type: string;
  is_system_folder: boolean;
  created_at: string;
  updated_at: string;
}

interface UnifiedData {
  emails: Email[];
  contacts: CRMContact[];
  meetings: Meeting[];
  folders: MailboxFolder[];
  isLoading: boolean;
  lastSync: string | null;
}

type SubscriberCallback = (data: UnifiedData) => void;

export class PersistentUnifiedDataService {
  private subscribers = new Map<string, SubscriberCallback>();
  private currentData: UnifiedData = {
    emails: [],
    contacts: [],
    meetings: [],
    folders: [],
    isLoading: false,
    lastSync: null
  };
  private userId: string | null = null;
  private isInitialized = false;

  async initialize(userId: string): Promise<void> {
    if (!userId) {
      console.warn('⚠️ PersistentUnifiedDataService: No userId provided');
      return;
    }

    this.userId = userId;
    this.isInitialized = true;
    console.log('🚀 PersistentUnifiedDataService: Initialized for user:', userId);
  }

  subscribe(subscriberId: string, callback: SubscriberCallback): () => void {
    this.subscribers.set(subscriberId, callback);
    console.log(`📡 PersistentUnifiedDataService: ${subscriberId} subscribed`);
    
    // Immediately notify with current data
    callback(this.currentData);
    
    return () => {
      this.subscribers.delete(subscriberId);
      console.log(`📡 PersistentUnifiedDataService: ${subscriberId} unsubscribed`);
    };
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

  async getData(forceRefresh = false): Promise<UnifiedData> {
    if (!this.userId || !this.isInitialized) {
      console.warn('⚠️ PersistentUnifiedDataService: Not initialized');
      return this.currentData;
    }

    try {
      this.currentData.isLoading = true;
      this.notifySubscribers();

      console.log('🚀 PersistentUnifiedDataService: Starting data load...');

      // First, load cached data from Supabase to show immediately
      await this.loadCachedData();
      
      // Update subscribers with cached data first (for immediate UI update)
      this.notifySubscribers();
      console.log('📂 Cached data loaded and displayed to users');

      // Get sync status to determine what needs updating
      const syncStatus = await this.getSyncStatus();
      
      if (forceRefresh || this.shouldSync(syncStatus)) {
        console.log('🔄 Performing incremental sync in background...');
        
        // Perform sync in background - don't wait for it to complete
        this.performIncrementalSync(syncStatus)
          .then(() => {
            console.log('✅ Background sync completed');
            this.currentData.lastSync = new Date().toISOString();
            this.notifySubscribers();
          })
          .catch((error) => {
            console.error('❌ Background sync failed:', error);
            // Don't throw - we already have cached data displayed
          })
          .finally(() => {
            this.currentData.isLoading = false;
            this.notifySubscribers();
          });
      } else {
        console.log('✅ Using cached data, no sync needed');
        this.currentData.isLoading = false;
        this.notifySubscribers();
      }

      return this.currentData;
    } catch (error) {
      console.error('❌ Failed to get unified data:', error);
      this.currentData.isLoading = false;
      this.notifySubscribers();
      return this.currentData;
    }
  }

  private async loadCachedData(): Promise<void> {
    const userId = this.userId!;
    
    console.log('📂 Loading cached data from Supabase...');

    try {
      const [emailsResult, contactsResult, meetingsResult, foldersResult] = await Promise.allSettled([
        this.loadCachedEmails(userId),
        this.loadCachedContacts(userId),
        this.loadCachedMeetings(userId),
        this.loadCachedFolders(userId)
      ]);

      this.currentData.emails = emailsResult.status === 'fulfilled' ? emailsResult.value : [];
      this.currentData.contacts = contactsResult.status === 'fulfilled' ? contactsResult.value : [];
      this.currentData.meetings = meetingsResult.status === 'fulfilled' ? meetingsResult.value : [];
      this.currentData.folders = foldersResult.status === 'fulfilled' ? foldersResult.value : [];

      console.log('✅ Cached data loaded:', {
        emails: this.currentData.emails.length,
        contacts: this.currentData.contacts.length,
        meetings: this.currentData.meetings.length,
        folders: this.currentData.folders.length
      });
    } catch (error) {
      console.error('❌ Failed to load cached data:', error);
    }
  }

  private async performIncrementalSync(syncStatus: SyncStatus | null): Promise<void> {
    const userId = this.userId!;
    
    try {
      // Determine sync timestamps
      const emailsSince = syncStatus?.last_emails_sync || null;
      const contactsSince = syncStatus?.last_contacts_sync || null;
      const meetingsSince = syncStatus?.last_meetings_sync || null;
      const foldersSince = syncStatus?.last_folders_sync || null;

      console.log('🔄 Incremental sync timestamps:', {
        emailsSince,
        contactsSince,
        meetingsSince,
        foldersSince
      });

      // Sync folders first (needed for email organization)
      await this.syncFolders(foldersSince);
      
      // Sync in parallel
      await Promise.allSettled([
        this.syncEmails(emailsSince),
        this.syncContacts(contactsSince),
        this.syncMeetings(meetingsSince)
      ]);

      // Update sync status
      await this.updateSyncStatus({
        last_emails_sync: new Date().toISOString(),
        last_contacts_sync: new Date().toISOString(),
        last_meetings_sync: new Date().toISOString(),
        last_folders_sync: new Date().toISOString()
      });

      console.log('✅ Incremental sync completed');
    } catch (error) {
      console.error('❌ Incremental sync failed:', error);
    }
  }

  private async syncEmails(since: string | null): Promise<void> {
    console.log('📧 Syncing emails since:', since);
    
    try {
      // Get emails from Microsoft Graph (with date filter if available)
      const graphEmails = await graphServiceManager.mail.getEmails('inbox', 50);

      if (graphEmails.length === 0) {
        console.log('📧 No new emails to sync');
        return;
      }

      // Convert and store in Supabase
      const emailsToStore = graphEmails.map(email => this.convertEmailForStorage(email));
      await this.storeEmails(emailsToStore);

      // Update current data
      const updatedEmails = await this.loadCachedEmails(this.userId!);
      this.currentData.emails = updatedEmails;

      console.log(`✅ Synced ${graphEmails.length} emails`);
    } catch (error) {
      console.error('❌ Email sync failed:', error);
    }
  }

  private async syncContacts(since: string | null): Promise<void> {
    console.log('👥 Syncing contacts since:', since);
    
    try {
      // Fetch contacts with reasonable limits to avoid overwhelming the API
      const [contacts, people, users] = await Promise.allSettled([
        graphServiceManager.contacts.getContacts({ top: 100 }), // Limit contacts
        graphServiceManager.people.getRelevantPeople({ top: 50 }), // Limit people  
        graphServiceManager.users.getUsers({ top: 30 }) // Limit users
      ]);

      let allContacts: any[] = [];
      let fetchErrors: string[] = [];
      
      if (contacts.status === 'fulfilled') {
        console.log(`📋 Fetched ${contacts.value.length} contacts from Graph Contacts API`);
        allContacts.push(...contacts.value.map(c => ({ ...c, source: 'contacts', graphType: 'contact' })));
      } else {
        console.warn('⚠️ Failed to fetch contacts:', contacts.reason);
        fetchErrors.push(`Contacts: ${contacts.reason}`);
      }
      
      if (people.status === 'fulfilled') {
        console.log(`👥 Fetched ${people.value.length} people from Graph People API`);
        allContacts.push(...people.value.map(p => ({ ...p, source: 'people', graphType: 'person' })));
      } else {
        console.warn('⚠️ Failed to fetch people:', people.reason);
        fetchErrors.push(`People: ${people.reason}`);
      }
      
      if (users.status === 'fulfilled') {
        console.log(`👤 Fetched ${users.value.length} users from Graph Users API`);
        allContacts.push(...users.value.map(u => ({ ...u, source: 'users', graphType: 'user' })));
      } else {
        console.warn('⚠️ Failed to fetch users:', users.reason);
        fetchErrors.push(`Users: ${users.reason}`);
      }

      if (allContacts.length === 0) {
        if (fetchErrors.length > 0) {
          console.warn('⚠️ No contacts synced due to API errors:', fetchErrors);
          // Still try to load cached contacts
          const cachedContacts = await this.loadCachedContacts(this.userId!);
          this.currentData.contacts = cachedContacts;
          console.log(`📂 Loaded ${cachedContacts.length} cached contacts as fallback`);
        } else {
          console.log('👥 No new contacts to sync');
        }
        return;
      }

      console.log(`🔄 Processing ${allContacts.length} total contacts for storage`);

      // Convert and validate contacts with better error handling
      const contactsToStore: PersistedContact[] = [];
      const conversionErrors: string[] = [];

      for (const contact of allContacts) {
        try {
          const convertedContact = this.convertContactForStorage(contact);
          contactsToStore.push(convertedContact);
        } catch (error) {
          conversionErrors.push(`Contact ${contact.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (conversionErrors.length > 0) {
        console.warn(`⚠️ Failed to convert ${conversionErrors.length} contacts:`, conversionErrors.slice(0, 5)); // Show first 5 errors
      }

      if (contactsToStore.length === 0) {
        console.warn('⚠️ No valid contacts to store after conversion');
        return;
      }

      // Store contacts in Supabase
      await this.storeContacts(contactsToStore);

      // Update current data
      const updatedContacts = await this.loadCachedContacts(this.userId!);
      this.currentData.contacts = updatedContacts;

      console.log(`✅ Synced ${contactsToStore.length} contacts successfully (${conversionErrors.length} failed conversions)`);
    } catch (error) {
      console.error('❌ Contact sync failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Try to load cached contacts as fallback
      try {
        const cachedContacts = await this.loadCachedContacts(this.userId!);
        this.currentData.contacts = cachedContacts;
        console.log(`📂 Loaded ${cachedContacts.length} cached contacts as fallback after sync failure`);
      } catch (fallbackError) {
        console.error('❌ Failed to load cached contacts as fallback:', fallbackError);
      }
    }
  }

  private async syncMeetings(since: string | null): Promise<void> {
    console.log('📅 Syncing meetings since:', since);
    
    try {
      const graphMeetings = await graphServiceManager.calendar.getEvents({
        filter: since ? `start/dateTime gt '${since}'` : undefined
      });

      if (graphMeetings.length === 0) {
        console.log('📅 No new meetings to sync');
        return;
      }

      // Convert and store in Supabase
      const meetingsToStore = graphMeetings.map(meeting => this.convertMeetingForStorage(meeting));
      await this.storeMeetings(meetingsToStore);

      // Update current data
      const updatedMeetings = await this.loadCachedMeetings(this.userId!);
      this.currentData.meetings = updatedMeetings;

      console.log(`✅ Synced ${graphMeetings.length} meetings`);
    } catch (error) {
      console.error('❌ Meeting sync failed:', error);
    }
  }

  private async syncFolders(since: string | null): Promise<void> {
    console.log('📁 Syncing folders...');
    
    try {
      const graphFolders = await graphServiceManager.mail.getMailFolders();

      if (graphFolders.length === 0) {
        console.log('📁 No folders to sync');
        return;
      }

      // Convert and store in Supabase
      const foldersToStore = graphFolders.map(folder => this.convertFolderForStorage(folder));
      await this.storeFolders(foldersToStore);

      // Update current data
      const updatedFolders = await this.loadCachedFolders(this.userId!);
      this.currentData.folders = updatedFolders;

      console.log(`✅ Synced ${graphFolders.length} folders`);
    } catch (error) {
      console.error('❌ Folder sync failed:', error);
    }
  }

  // Database operations
  private async getSyncStatus(): Promise<SyncStatus | null> {
    try {
      const { data, error } = await supabase
        .from('unified_sync_status')
        .select('*')
        .eq('user_id', this.userId!)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Failed to get sync status:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return null;
    }
  }

  private async updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
    try {
      const { error } = await supabase
        .from('unified_sync_status')
        .upsert({
          user_id: this.userId!,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Failed to update sync status:', error);
      }
    } catch (error) {
      console.error('❌ Failed to update sync status:', error);
    }
  }

  private shouldSync(syncStatus: SyncStatus | null): boolean {
    if (!syncStatus) return true;
    
    const now = new Date();
    
    // Check the most recent sync across all data types
    const lastEmailSync = syncStatus.last_emails_sync ? new Date(syncStatus.last_emails_sync) : null;
    const lastContactSync = syncStatus.last_contacts_sync ? new Date(syncStatus.last_contacts_sync) : null;
    const lastMeetingSync = syncStatus.last_meetings_sync ? new Date(syncStatus.last_meetings_sync) : null;
    
    const mostRecentSync = [lastEmailSync, lastContactSync, lastMeetingSync]
      .filter(date => date !== null)
      .sort((a, b) => b!.getTime() - a!.getTime())[0];
    
    if (!mostRecentSync) return true;
    
    // Sync if last sync was more than 30 minutes ago (reduced from 1 hour for better UX)
    const minutesSinceLastSync = (now.getTime() - mostRecentSync.getTime()) / (1000 * 60);
    const shouldSync = minutesSinceLastSync > 30;
    
    console.log(`🕒 Last sync: ${mostRecentSync.toLocaleString()}, ${Math.round(minutesSinceLastSync)} minutes ago, should sync: ${shouldSync}`);
    
    return shouldSync;
  }

  // Storage methods
  private async storeEmails(emails: PersistedEmail[]): Promise<void> {
    const { error } = await supabase
      .from('unified_emails')
      .upsert(emails, { onConflict: 'user_id,graph_message_id' });

    if (error) {
      console.error('❌ Failed to store emails:', error);
      throw error;
    }
  }

  private async storeContacts(contacts: PersistedContact[]): Promise<void> {
    if (!contacts || contacts.length === 0) {
      console.log('📝 No contacts to store');
      return;
    }

    console.log(`📝 Storing ${contacts.length} contacts to Supabase...`);

    try {
      // Validate contacts before storing
      const validContacts = contacts.filter(contact => {
        const isValid = contact.user_id && contact.graph_contact_id && contact.name;
        if (!isValid) {
          console.warn('⚠️ Invalid contact data:', {
            hasUserId: !!contact.user_id,
            hasGraphId: !!contact.graph_contact_id,
            hasName: !!contact.name,
            contact: contact
          });
        }
        return isValid;
      });

      if (validContacts.length === 0) {
        console.warn('⚠️ No valid contacts to store');
        return;
      }

      if (validContacts.length !== contacts.length) {
        console.warn(`⚠️ Filtered out ${contacts.length - validContacts.length} invalid contacts`);
      }

      // Store in smaller batches to avoid overwhelming Supabase
      const batchSize = 50;
      for (let i = 0; i < validContacts.length; i += batchSize) {
        const batch = validContacts.slice(i, i + batchSize);
        console.log(`📝 Storing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validContacts.length / batchSize)} (${batch.length} contacts)`);
        
        const { error } = await supabase
          .from('unified_contacts')
          .upsert(batch, { onConflict: 'user_id,graph_contact_id' });

        if (error) {
          console.error(`❌ Failed to store contacts batch ${Math.floor(i / batchSize) + 1}:`, {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            batchSize: batch.length,
            sampleContact: batch[0]
          });
          throw error;
        }
      }

      console.log(`✅ Successfully stored ${validContacts.length} contacts`);
    } catch (error) {
      console.error('❌ Failed to store contacts:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        contactCount: contacts.length,
        sampleContact: contacts[0]
      });
      throw error;
    }
  }

  private async storeMeetings(meetings: PersistedMeeting[]): Promise<void> {
    const { error } = await supabase
      .from('unified_meetings')
      .upsert(meetings, { onConflict: 'user_id,graph_event_id' });

    if (error) {
      console.error('❌ Failed to store meetings:', error);
      throw error;
    }
  }

  private async storeFolders(folders: PersistedFolder[]): Promise<void> {
    const { error } = await supabase
      .from('unified_folders')
      .upsert(folders, { onConflict: 'user_id,graph_folder_id' });

    if (error) {
      console.error('❌ Failed to store folders:', error);
      throw error;
    }
  }

  // Load methods
  private async loadCachedEmails(userId: string): Promise<Email[]> {
    const { data, error } = await supabase
      .from('unified_emails')
      .select('*')
      .eq('user_id', userId)
      .order('received_date_time', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Failed to load cached emails:', error);
      return [];
    }

    return data.map(email => this.convertStoredEmailToEmail(email));
  }

  private async loadCachedContacts(userId: string): Promise<CRMContact[]> {
    const { data, error } = await supabase
      .from('unified_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('❌ Failed to load cached contacts:', error);
      return [];
    }

    return data.map(contact => this.convertStoredContactToCRMContact(contact));
  }

  private async loadCachedMeetings(userId: string): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('unified_meetings')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Failed to load cached meetings:', error);
      return [];
    }

    return data.map(meeting => this.convertStoredMeetingToMeeting(meeting));
  }

  private async loadCachedFolders(userId: string): Promise<MailboxFolder[]> {
    const { data, error } = await supabase
      .from('unified_folders')
      .select('*')
      .eq('user_id', userId)
      .order('display_name');

    if (error) {
      console.error('❌ Failed to load cached folders:', error);
      return [];
    }

    return data.map(folder => this.convertStoredFolderToMailboxFolder(folder));
  }

  // Conversion methods
  private convertEmailForStorage(email: any): PersistedEmail {
    return {
      id: crypto.randomUUID(),
      user_id: this.userId!,
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

  private convertContactForStorage(contact: any): PersistedContact {
    if (!contact || !contact.id) {
      throw new Error('Invalid contact data: missing id');
    }

    // Safely build the name with fallbacks
    let name = 'Unknown';
    if (contact.displayName) {
      name = contact.displayName;
    } else if (contact.givenName || contact.surname) {
      const firstName = contact.givenName || '';
      const lastName = contact.surname || '';
      name = `${firstName} ${lastName}`.trim() || 'Unknown';
    }

    // Safely extract email with fallbacks
    let email = '';
    if (contact.emailAddresses && Array.isArray(contact.emailAddresses) && contact.emailAddresses.length > 0) {
      email = contact.emailAddresses[0]?.address || '';
    } else if (contact.mail) {
      email = contact.mail;
    } else if (contact.userPrincipalName) {
      email = contact.userPrincipalName;
    } else if (contact.scoredEmailAddresses && Array.isArray(contact.scoredEmailAddresses) && contact.scoredEmailAddresses.length > 0) {
      email = contact.scoredEmailAddresses[0]?.address || '';
    }

    // Safely extract phone with fallbacks
    let phone = null;
    if (contact.mobilePhone) {
      phone = contact.mobilePhone;
    } else if (contact.businessPhones && Array.isArray(contact.businessPhones) && contact.businessPhones.length > 0) {
      phone = contact.businessPhones[0];
    } else if (contact.phones && Array.isArray(contact.phones) && contact.phones.length > 0) {
      phone = contact.phones[0]?.number || contact.phones[0];
    }

    return {
      id: crypto.randomUUID(),
      user_id: this.userId!,
      graph_contact_id: contact.id,
      name: name,
      email: email,
      phone: phone,
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

  private convertMeetingForStorage(meeting: any): PersistedMeeting {
    return {
      id: crypto.randomUUID(),
      user_id: this.userId!,
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
    };
  }

  private convertFolderForStorage(folder: any): PersistedFolder {
    return {
      id: crypto.randomUUID(),
      user_id: this.userId!,
      graph_folder_id: folder.id,
      display_name: folder.displayName || 'Unknown Folder',
      unread_count: folder.unreadItemCount || 0,
      total_count: folder.totalItemCount || 0,
      folder_type: this.determineFolderType(folder.displayName),
      is_system_folder: this.isSystemFolder(folder.displayName),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Convert back from storage
  private convertStoredEmailToEmail(stored: PersistedEmail): Email {
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

  private convertStoredContactToCRMContact(stored: PersistedContact): CRMContact {
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
      dealValue: 0, // Will be calculated based on interactions
      avatar: this.getAvatarUrl(stored.name),
      tags: [],
      source: stored.source,
      graphType: stored.graph_type
    };
  }

  private convertStoredMeetingToMeeting(stored: PersistedMeeting): Meeting {
    return {
      id: stored.graph_event_id,
      subject: stored.subject,
      startTime: stored.start_time,
      endTime: stored.end_time,
      attendees: stored.attendees,
      organizerEmail: stored.organizer_email,
      location: stored.location,
      isOnlineMeeting: stored.is_online_meeting
    };
  }

  private convertStoredFolderToMailboxFolder(stored: PersistedFolder): MailboxFolder {
    return {
      id: stored.folder_type || stored.graph_folder_id,
      displayName: stored.display_name,
      unreadCount: stored.unread_count,
      totalCount: stored.total_count,
      isSystemFolder: stored.is_system_folder,
      icon: this.getFolderIcon(stored.folder_type),
      graphId: stored.graph_folder_id
    };
  }

  // Helper methods
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

  private deriveContactStatus(contact: PersistedContact): string {
    if (contact.source === 'users') return 'employee';
    if (contact.source === 'people') return 'partner';
    return 'prospect';
  }

  private getAvatarUrl(name: string): string {
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
  }

  private formatTimestamp(timestamp: string): string {
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

  private getFolderIcon(folderType: string): string {
    switch (folderType) {
      case 'inbox': return 'Inbox';
      case 'sent': return 'Send';
      case 'drafts': return 'Mail';
      case 'deletedItems': return 'Trash';
      default: return 'Folder';
    }
  }

  async clearCache(): Promise<void> {
    const userId = this.userId!;
    
    await Promise.allSettled([
      supabase.from('unified_emails').delete().eq('user_id', userId),
      supabase.from('unified_contacts').delete().eq('user_id', userId),
      supabase.from('unified_meetings').delete().eq('user_id', userId),
      supabase.from('unified_folders').delete().eq('user_id', userId),
      supabase.from('unified_sync_status').delete().eq('user_id', userId)
    ]);

    this.currentData = {
      emails: [],
      contacts: [],
      meetings: [],
      folders: [],
      isLoading: false,
      lastSync: null
    };

    this.notifySubscribers();
    console.log('✅ Persistent cache cleared');
  }
}

export const persistentUnifiedDataService = new PersistentUnifiedDataService(); 