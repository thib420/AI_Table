import { graphServiceManager } from '@/shared/services/microsoft-graph';
import { 
  Contact, 
  CustomerProfile, 
  CustomerEmail, 
  CustomerMeeting, 
  CustomerDocument, 
  CustomerInteraction 
} from '../types';
import { GraphCRMService } from './GraphCRMService';

export class Customer360Service {
  private crmService: GraphCRMService;

  constructor() {
    this.crmService = new GraphCRMService();
  }

  /**
   * Get comprehensive customer profile by email
   */
  async getCustomerProfile(email: string): Promise<CustomerProfile | null> {
    try {
      console.log(`🚀 Customer360Service: Getting profile for ${email}`);
      await graphServiceManager.initialize();

      // Get or create contact
      console.log(`👤 Finding or creating contact for ${email}`);
      let contact = await this.findOrCreateContact(email);
      if (!contact) {
        console.error(`❌ Failed to find or create contact for ${email}`);
        return null;
      }
      console.log(`✅ Contact found/created:`, contact.name);

      // Fetch all customer data in parallel
      console.log(`📊 Fetching customer data in parallel...`);
      const [emails, meetings, documents] = await Promise.allSettled([
        this.getCustomerEmails(email),
        this.getCustomerMeetings(email),
        this.getCustomerDocuments(email)
      ]);

      const customerEmails = emails.status === 'fulfilled' ? emails.value : [];
      const customerMeetings = meetings.status === 'fulfilled' ? meetings.value : [];
      const customerDocuments = documents.status === 'fulfilled' ? documents.value : [];

      console.log(`📈 Data summary:`, {
        emails: customerEmails.length,
        meetings: customerMeetings.length,
        documents: customerDocuments.length
      });

      // Generate interactions timeline
      const interactions = this.generateInteractionsTimeline(
        customerEmails,
        customerMeetings,
        customerDocuments
      );

      // Calculate stats
      const stats = this.calculateCustomerStats(
        customerEmails,
        customerMeetings,
        customerDocuments,
        interactions
      );

      console.log(`✅ Customer profile generated successfully for ${email}`);

      return {
        contact,
        emails: customerEmails,
        meetings: customerMeetings,
        documents: customerDocuments,
        interactions,
        stats,
        timeline: interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    } catch (error) {
      console.error(`❌ Error getting customer profile for ${email}:`, error);
      return null;
    }
  }

  /**
   * Find existing contact or create new one from email
   */
  private async findOrCreateContact(email: string): Promise<Contact | null> {
    try {
      console.log(`🔍 Searching for existing contact: ${email}`);
      
      // First try to find existing contact
      const contacts = await this.crmService.searchContacts(email);
      console.log(`📋 Found ${contacts.length} existing contacts`);
      
      const existingContact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
      
      if (existingContact) {
        console.log(`✅ Found existing contact: ${existingContact.name}`);
        return existingContact;
      }

      console.log(`👤 Creating new contact for ${email}`);
      
      // If not found, try to get info from Microsoft Graph
      const userInfo = await this.getUserInfoFromGraph(email);
      
      // Create new contact
      const newContact: Partial<Contact> = {
        name: userInfo.displayName || this.extractNameFromEmail(email),
        email: email,
        phone: userInfo.phone || '',
        company: userInfo.company || this.extractCompanyFromEmail(email),
        position: userInfo.jobTitle || '',
        location: userInfo.location || '',
        status: 'lead',
        lastContact: new Date().toISOString(),
        dealValue: 0,
        tags: ['from-mailbox'],
        source: 'Microsoft Graph'
      };

      console.log(`📝 Creating contact with data:`, newContact);
      const createdContact = await this.crmService.createContact(newContact);
      console.log(`✅ Contact created successfully: ${createdContact.name}`);
      
      return createdContact;
    } catch (error) {
      console.error('❌ Error finding/creating contact:', error);
      
      // Create a fallback contact if Graph services fail
      console.log(`🔄 Creating fallback contact for ${email}`);
      const fallbackContact: Contact = {
        id: `fallback-${Date.now()}`,
        name: this.extractNameFromEmail(email),
        email: email,
        phone: '',
        company: this.extractCompanyFromEmail(email),
        position: '',
        location: '',
        status: 'lead',
        lastContact: new Date().toISOString().split('T')[0],
        dealValue: 0,
        tags: ['from-mailbox', 'fallback'],
        source: 'Fallback'
      };
      
      console.log(`✅ Fallback contact created: ${fallbackContact.name}`);
      return fallbackContact;
    }
  }

  /**
   * Get all emails related to customer
   */
  private async getCustomerEmails(email: string): Promise<CustomerEmail[]> {
    try {
      console.log(`🔍 Customer360Service: Getting emails for ${email}`);
      
      // First try the sender-specific search, then the general search
      const [senderEmails, searchEmails] = await Promise.allSettled([
        graphServiceManager.mail.getEmailsFromSender(email),
        graphServiceManager.mail.searchEmails(email)
      ]);

      console.log(`📧 Email search results:`, {
        senderEmails: senderEmails.status,
        searchEmails: searchEmails.status,
        senderCount: senderEmails.status === 'fulfilled' ? senderEmails.value.length : 0,
        searchCount: searchEmails.status === 'fulfilled' ? searchEmails.value.length : 0
      });

      const emails: CustomerEmail[] = [];
      const processedIds = new Set<string>(); // Avoid duplicates

      // Process emails from sender search (these are definitely from the customer)
      if (senderEmails.status === 'fulfilled') {
        console.log(`✅ Processing ${senderEmails.value.length} emails from sender`);
        senderEmails.value.forEach(email => {
          if (email.id && !processedIds.has(email.id)) {
            processedIds.add(email.id);
            emails.push({
              id: email.id || '',
              subject: email.subject || '',
              preview: email.bodyPreview || '',
              sender: email.sender?.emailAddress?.name || '',
              senderEmail: email.sender?.emailAddress?.address || '',
              receivedDateTime: email.receivedDateTime || '',
              isRead: email.isRead || false,
              importance: (email.importance as 'low' | 'normal' | 'high') || 'normal',
              hasAttachments: email.hasAttachments || false,
              direction: 'inbound' as const
            });
          }
        });
      } else {
        console.error('❌ Failed to get emails from sender:', senderEmails.reason);
      }

      // Process emails from general search (may include emails to/from the customer)
      if (searchEmails.status === 'fulfilled') {
        console.log(`✅ Processing ${searchEmails.value.length} emails from search`);
        searchEmails.value.forEach(email => {
          if (email.id && !processedIds.has(email.id)) {
            processedIds.add(email.id);
            
            // Determine direction based on sender
            const direction = email.sender?.emailAddress?.address?.toLowerCase() === email.toLowerCase() 
              ? 'inbound' : 'outbound';
            
            emails.push({
              id: email.id || '',
              subject: email.subject || '',
              preview: email.bodyPreview || '',
              sender: email.sender?.emailAddress?.name || '',
              senderEmail: email.sender?.emailAddress?.address || '',
              receivedDateTime: email.receivedDateTime || '',
              isRead: email.isRead || false,
              importance: (email.importance as 'low' | 'normal' | 'high') || 'normal',
              hasAttachments: email.hasAttachments || false,
              direction
            });
          }
        });
      } else {
        console.error('❌ Failed to get emails from search:', searchEmails.reason);
      }

      console.log(`📊 Total emails found: ${emails.length} (unique)`);
      
      return emails.sort((a, b) => 
        new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime()
      );
    } catch (error) {
      console.error('❌ Error getting customer emails:', error);
      return [];
    }
  }

  /**
   * Get all meetings related to customer
   */
  private async getCustomerMeetings(email: string): Promise<CustomerMeeting[]> {
    try {
      // This would require calendar API integration
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error getting customer meetings:', error);
      return [];
    }
  }

  /**
   * Get all documents shared with customer
   */
  private async getCustomerDocuments(email: string): Promise<CustomerDocument[]> {
    try {
      // This would require OneDrive/SharePoint API integration
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error getting customer documents:', error);
      return [];
    }
  }

  /**
   * Generate unified interactions timeline
   */
  private generateInteractionsTimeline(
    emails: CustomerEmail[],
    meetings: CustomerMeeting[],
    documents: CustomerDocument[]
  ): CustomerInteraction[] {
    const interactions: CustomerInteraction[] = [];

    // Add email interactions
    emails.forEach(email => {
      interactions.push({
        id: `email-${email.id}`,
        type: 'email',
        title: email.subject,
        description: email.preview,
        date: email.receivedDateTime,
        direction: email.direction,
        importance: email.importance,
        metadata: {
          hasAttachments: email.hasAttachments,
          isRead: email.isRead
        }
      });
    });

    // Add meeting interactions
    meetings.forEach(meeting => {
      interactions.push({
        id: `meeting-${meeting.id}`,
        type: 'meeting',
        title: meeting.subject,
        description: `Meeting with ${meeting.attendees.length} attendees`,
        date: meeting.start,
        importance: 'normal',
        metadata: {
          duration: this.calculateMeetingDuration(meeting.start, meeting.end),
          isOnline: meeting.isOnline,
          status: meeting.status
        }
      });
    });

    // Add document interactions
    documents.forEach(document => {
      interactions.push({
        id: `document-${document.id}`,
        type: 'document',
        title: document.name,
        description: `Document shared by ${document.sharedBy}`,
        date: document.lastModified,
        importance: 'normal',
        metadata: {
          type: document.type,
          size: document.size,
          isShared: document.isShared
        }
      });
    });

    return interactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Calculate customer engagement stats
   */
  private calculateCustomerStats(
    emails: CustomerEmail[],
    meetings: CustomerMeeting[],
    documents: CustomerDocument[],
    interactions: CustomerInteraction[]
  ) {
    const now = new Date();
    const lastInteraction = interactions.length > 0 ? interactions[0].date : '';
    
    // Calculate average response time (simplified)
    const responseTime = this.calculateAverageResponseTime(emails);
    
    // Calculate engagement score based on interaction frequency and recency
    const engagementScore = this.calculateEngagementScore(interactions);

    return {
      totalEmails: emails.length,
      totalMeetings: meetings.length,
      totalDocuments: documents.length,
      lastInteraction,
      responseTime,
      engagementScore
    };
  }

  /**
   * Helper methods
   */
  private async getUserInfoFromGraph(email: string): Promise<any> {
    try {
      // Try to get user info from Graph API
      // This is a placeholder - would need proper Graph API integration
      return {};
    } catch (error) {
      return {};
    }
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

  private calculateMeetingDuration(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.round((endTime - startTime) / (1000 * 60)); // Duration in minutes
  }

  private calculateAverageResponseTime(emails: CustomerEmail[]): string {
    // Simplified calculation - in reality would need to track email threads
    const recentEmails = emails.slice(0, 10);
    if (recentEmails.length === 0) return 'N/A';
    
    // Mock calculation
    return '2h 30m';
  }

  private calculateEngagementScore(interactions: CustomerInteraction[]): number {
    if (interactions.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentInteractions = interactions.filter(
      interaction => new Date(interaction.date) > thirtyDaysAgo
    );
    
    // Score based on frequency and recency
    const frequencyScore = Math.min(recentInteractions.length * 10, 70);
    const recencyScore = interactions.length > 0 ? 30 : 0;
    
    return Math.min(frequencyScore + recencyScore, 100);
  }
}

export const customer360Service = new Customer360Service(); 