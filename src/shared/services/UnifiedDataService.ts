import { 
  graphServiceManager,
  graphDataTransformers,
  withRetry
} from '@/shared/services/microsoft-graph';
import { Message, MailFolder, Event } from '@microsoft/microsoft-graph-types';
import { CRMContact, GraphContact } from '@/shared/services/microsoft-graph/types';

interface UnifiedData {
  emails: Message[];
  folders: MailFolder[];
  contacts: CRMContact[];
  meetings: Event[];
  lastFetch: Date;
  isLoading: boolean;
}

interface DataSubscriber {
  id: string;
  onDataUpdate: (data: UnifiedData) => void;
}

/**
 * Unified Data Service - Single source of truth for Microsoft Graph data
 * Loads data once and shares it between Mailbox and CRM modules
 */
export class UnifiedDataService {
  private static instance: UnifiedDataService;
  private data: UnifiedData = {
    emails: [],
    folders: [],
    contacts: [],
    meetings: [],
    lastFetch: new Date(0),
    isLoading: false
  };
  
  private subscribers: Map<string, DataSubscriber> = new Map();
  private fetchPromise: Promise<void> | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {}
  
  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }
  
  /**
   * Subscribe to data updates
   */
  subscribe(id: string, onDataUpdate: (data: UnifiedData) => void): () => void {
    this.subscribers.set(id, { id, onDataUpdate });
    
    // Send current data immediately
    onDataUpdate(this.data);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }
  
  /**
   * Get current data (cached if fresh enough)
   */
  async getData(forceRefresh = false): Promise<UnifiedData> {
    const now = new Date();
    const cacheAge = now.getTime() - this.data.lastFetch.getTime();
    
    // Return cached data if fresh enough and not forcing refresh
    if (!forceRefresh && cacheAge < this.CACHE_DURATION && this.data.emails.length > 0) {
      console.log('📦 UnifiedDataService: Returning cached data');
      return this.data;
    }
    
    // If already fetching, wait for that to complete
    if (this.fetchPromise) {
      console.log('⏳ UnifiedDataService: Waiting for existing fetch to complete');
      await this.fetchPromise;
      return this.data;
    }
    
    // Start new fetch
    console.log('🔄 UnifiedDataService: Starting unified data fetch');
    this.fetchPromise = this.fetchAllData();
    
    try {
      await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
    
    return this.data;
  }
  
  /**
   * Fetch all data from Microsoft Graph in parallel
   */
  private async fetchAllData(): Promise<void> {
    try {
      this.data.isLoading = true;
      this.notifySubscribers();
      
      await graphServiceManager.initialize();
      
      console.log('🚀 UnifiedDataService: Fetching all data in parallel...');
      const startTime = Date.now();
      
      // Fetch everything in parallel
      const [
        foldersResult,
        emailsResult,
        contactsResult,
        peopleResult,
        usersResult,
        meetingsResult
      ] = await Promise.allSettled([
        this.fetchFolders(),
        this.fetchEmails(),
        this.fetchContacts(),
        this.fetchPeople(),
        this.fetchUsers(),
        this.fetchMeetings()
      ]);
      
      // Process folders
      if (foldersResult.status === 'fulfilled') {
        this.data.folders = foldersResult.value;
        console.log(`📁 Loaded ${this.data.folders.length} folders`);
      }
      
      // Process emails
      if (emailsResult.status === 'fulfilled') {
        this.data.emails = emailsResult.value;
        console.log(`📧 Loaded ${this.data.emails.length} emails`);
      }
      
      // Merge all contact sources
      const allContacts: CRMContact[] = [];
      
      if (contactsResult.status === 'fulfilled') {
        allContacts.push(...contactsResult.value);
      }
      
      if (peopleResult.status === 'fulfilled') {
        allContacts.push(...peopleResult.value);
      }
      
      if (usersResult.status === 'fulfilled') {
        allContacts.push(...usersResult.value);
      }
      
      // Extract contacts from emails if we have them
      if (this.data.emails.length > 0) {
        const emailContacts = this.extractContactsFromEmails(this.data.emails);
        allContacts.push(...emailContacts);
      }
      
      // Merge duplicates and enrich
      this.data.contacts = graphDataTransformers.mergeDuplicateContacts(allContacts);
      console.log(`👥 Merged to ${this.data.contacts.length} unique contacts`);
      
      // Process meetings
      if (meetingsResult.status === 'fulfilled') {
        this.data.meetings = meetingsResult.value;
        console.log(`📅 Loaded ${this.data.meetings.length} meetings`);
      }
      
      // Enrich contacts with interaction data
      this.enrichContactsWithInteractions();
      
      this.data.lastFetch = new Date();
      this.data.isLoading = false;
      
      const fetchTime = Date.now() - startTime;
      console.log(`✅ UnifiedDataService: All data loaded in ${fetchTime}ms`);
      
      // Notify all subscribers
      this.notifySubscribers();
      
    } catch (error) {
      console.error('❌ UnifiedDataService: Failed to fetch data:', error);
      this.data.isLoading = false;
      this.notifySubscribers();
      throw error;
    }
  }
  
  /**
   * Individual fetch methods
   */
  private async fetchFolders(): Promise<MailFolder[]> {
    try {
      return await withRetry(() => 
        graphServiceManager.mail.getMailFolders()
      );
    } catch (error) {
      console.error('❌ Failed to fetch folders:', error);
      return [];
    }
  }
  
  private async fetchEmails(): Promise<Message[]> {
    try {
      const systemFolders = ['inbox', 'sentitems', 'drafts', 'deleteditems'];
      const emailMap = new Map<string, Message>();
      
      // Fetch from each folder in parallel
      const folderPromises = systemFolders.map(folderId => 
        withRetry(() => graphServiceManager.mail.getEmails(folderId, 50))
          .catch(() => []) // Return empty array on error
      );
      
      const allFolderEmails = await Promise.all(folderPromises);
      
      // Merge and deduplicate
      allFolderEmails.flat().forEach(email => {
        if (email.id && !emailMap.has(email.id)) {
          emailMap.set(email.id, email);
        }
      });
      
      return Array.from(emailMap.values());
    } catch (error) {
      console.error('❌ Failed to fetch emails:', error);
      return [];
    }
  }
  
  private async fetchContacts(): Promise<CRMContact[]> {
    try {
      const contacts = await withRetry(() => 
        graphServiceManager.contacts.getContacts({ top: 100 })
      );
      return graphDataTransformers.contactsToCRM(contacts);
    } catch (error) {
      console.error('❌ Failed to fetch contacts:', error);
      return [];
    }
  }
  
  private async fetchPeople(): Promise<CRMContact[]> {
    try {
      const people = await withRetry(() => 
        graphServiceManager.people?.getRelevantPeople({ top: 50 }) || Promise.resolve([])
      );
      return graphDataTransformers.peopleToCRM(people);
    } catch (error) {
      console.error('❌ Failed to fetch people:', error);
      return [];
    }
  }
  
  private async fetchUsers(): Promise<CRMContact[]> {
    try {
      const users = await withRetry(() => 
        graphServiceManager.users?.getUsers({ top: 30 }) || Promise.resolve([])
      );
      return graphDataTransformers.usersToCRM(users);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      return [];
    }
  }
  
  private async fetchMeetings(): Promise<Event[]> {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      
      return await withRetry(() => 
        graphServiceManager.calendar?.getEvents({
          startTime,
          endTime,
          top: 50,
          orderBy: 'start/dateTime desc'
        }) || Promise.resolve([])
      );
    } catch (error) {
      console.error('❌ Failed to fetch meetings:', error);
      return [];
    }
  }
  
  /**
   * Extract contacts from email senders/recipients
   */
  private extractContactsFromEmails(emails: Message[]): CRMContact[] {
    const contactMap = new Map<string, CRMContact>();
    
    emails.forEach(email => {
      // Process sender
      if (email.sender?.emailAddress?.address) {
        const senderEmail = email.sender.emailAddress.address.toLowerCase();
        if (!contactMap.has(senderEmail)) {
          contactMap.set(senderEmail, {
            id: `email-contact-${senderEmail}`,
            name: email.sender.emailAddress.name || this.extractNameFromEmail(senderEmail),
            email: senderEmail,
            phone: '',
            company: this.extractCompanyFromEmail(senderEmail),
            position: '',
            location: '',
            status: 'lead',
            lastContact: email.receivedDateTime || new Date().toISOString(),
            dealValue: 0,
            tags: ['from-email'],
            source: 'Email',
            graphId: `email-${senderEmail}`,
            graphType: 'contact' as const
          });
        }
      }
      
      // Process recipients
      [...(email.toRecipients || []), ...(email.ccRecipients || [])].forEach(recipient => {
        if (recipient.emailAddress?.address) {
          const recipientEmail = recipient.emailAddress.address.toLowerCase();
          if (!contactMap.has(recipientEmail)) {
            contactMap.set(recipientEmail, {
              id: `email-contact-${recipientEmail}`,
              name: recipient.emailAddress.name || this.extractNameFromEmail(recipientEmail),
              email: recipientEmail,
              phone: '',
              company: this.extractCompanyFromEmail(recipientEmail),
              position: '',
              location: '',
              status: 'lead',
              lastContact: email.sentDateTime || email.receivedDateTime || new Date().toISOString(),
              dealValue: 0,
              tags: ['from-email'],
                             source: 'Email',
               graphId: `email-${recipientEmail}`,
               graphType: 'contact' as const
            });
          }
        }
      });
    });
    
    return Array.from(contactMap.values());
  }
  
  /**
   * Enrich contacts with last interaction data
   */
  private enrichContactsWithInteractions(): void {
    const interactionMap = new Map<string, Date>();
    
    // Process emails
    this.data.emails.forEach(email => {
      const date = new Date(email.receivedDateTime || email.sentDateTime || 0);
      
      // Update sender
      if (email.sender?.emailAddress?.address) {
        const current = interactionMap.get(email.sender.emailAddress.address.toLowerCase());
        if (!current || date > current) {
          interactionMap.set(email.sender.emailAddress.address.toLowerCase(), date);
        }
      }
      
      // Update recipients
      [...(email.toRecipients || []), ...(email.ccRecipients || [])].forEach(recipient => {
        if (recipient.emailAddress?.address) {
          const current = interactionMap.get(recipient.emailAddress.address.toLowerCase());
          if (!current || date > current) {
            interactionMap.set(recipient.emailAddress.address.toLowerCase(), date);
          }
        }
      });
    });
    
    // Process meetings
    this.data.meetings.forEach(meeting => {
      const date = new Date(meeting.start?.dateTime || 0);
      
      [...(meeting.attendees || []), meeting.organizer].forEach(person => {
        if (person?.emailAddress?.address) {
          const current = interactionMap.get(person.emailAddress.address.toLowerCase());
          if (!current || date > current) {
            interactionMap.set(person.emailAddress.address.toLowerCase(), date);
          }
        }
      });
    });
    
    // Update contacts with interaction data
    this.data.contacts = this.data.contacts.map(contact => {
      const lastInteraction = interactionMap.get(contact.email.toLowerCase());
      if (lastInteraction) {
        return {
          ...contact,
          lastContact: lastInteraction.toISOString(),
          status: this.calculateStatus(contact.status, lastInteraction)
        };
      }
      return contact;
    });
  }
  
  /**
   * Helper methods
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      subscriber.onDataUpdate(this.data);
    });
  }
  
  private extractNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    return localPart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }
  
  private extractCompanyFromEmail(email: string): string {
    const domain = email.split('@')[1];
    if (!domain) return '';
    
    const parts = domain.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  
  private calculateStatus(currentStatus: string, lastInteraction: Date): 'lead' | 'prospect' | 'customer' | 'inactive' {
    const daysSince = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 7) return 'customer';
    if (daysSince <= 30) return 'prospect';
    if (daysSince <= 90) return currentStatus as any;
    return 'inactive';
  }
  
  /**
   * Clear all cached data
   */
  clear(): void {
    this.data = {
      emails: [],
      folders: [],
      contacts: [],
      meetings: [],
      lastFetch: new Date(0),
      isLoading: false
    };
    this.fetchPromise = null;
    this.notifySubscribers();
  }
}

export const unifiedDataService = UnifiedDataService.getInstance(); 