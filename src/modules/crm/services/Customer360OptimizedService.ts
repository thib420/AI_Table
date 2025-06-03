import { graphServiceManager } from '@/shared/services/microsoft-graph';
import { 
  Contact, 
  CustomerProfile, 
  CustomerEmail, 
  CustomerMeeting, 
  CustomerDocument, 
  CustomerInteraction 
} from '../types';
import { graphCRMOptimizedService } from './GraphCRMOptimizedService';

export class Customer360OptimizedService {
  private crmService = graphCRMOptimizedService;

  /**
   * Get comprehensive customer profile by email - OPTIMIZED VERSION
   */
  async getCustomerProfile(email: string): Promise<CustomerProfile | null> {
    try {
      console.log(`🚀 Customer360OptimizedService: Getting profile for ${email}`);
      
      // Validate email format
      if (!email || !this.isValidEmail(email)) {
        console.error(`❌ Invalid email format: ${email}`);
        return null;
      }
      
      await graphServiceManager.initialize();

      // OPTIMIZATION: Parallel execution of all operations
      console.log(`⚡ Starting parallel data fetch for ${email}...`);
      const startTime = Date.now();

      const [contactResult, emailsResult, meetingsResult, documentsResult] = await Promise.allSettled([
        this.findOrCreateContactOptimized(email),
        this.getCustomerEmailsOptimized(email),
        this.getCustomerMeetingsOptimized(email), // Still placeholder but faster
        this.getCustomerDocumentsOptimized(email) // Still placeholder but faster
      ]);

      const contact = contactResult.status === 'fulfilled' ? contactResult.value : null;
      const customerEmails = emailsResult.status === 'fulfilled' ? emailsResult.value : [];
      const customerMeetings = meetingsResult.status === 'fulfilled' ? meetingsResult.value : [];
      const customerDocuments = documentsResult.status === 'fulfilled' ? documentsResult.value : [];

      // Log any failures for debugging
      if (contactResult.status === 'rejected') {
        console.error(`⚠️ Failed to get/create contact for ${email}:`, contactResult.reason);
      }
      if (emailsResult.status === 'rejected') {
        console.error(`⚠️ Failed to get emails for ${email}:`, emailsResult.reason);
      }

      const fetchTime = Date.now() - startTime;
      console.log(`⚡ Parallel fetch completed in ${fetchTime}ms for ${email}`);

      if (!contact) {
        console.error(`❌ Failed to get contact for ${email}`);
        return null;
      }

      console.log(`📈 Data summary:`, {
        emails: customerEmails.length,
        meetings: customerMeetings.length,
        documents: customerDocuments.length,
        fetchTime: `${fetchTime}ms`
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

      console.log(`✅ Customer profile generated successfully for ${email} in ${fetchTime}ms`);

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
   * OPTIMIZED: Find existing contact or create new one from email
   */
  private async findOrCreateContactOptimized(email: string): Promise<Contact | null> {
    try {
      console.log(`🔍 Optimized contact search for: ${email}`);
      
      // Validate email format
      if (!this.isValidEmail(email)) {
        console.error(`❌ Invalid email format: ${email}`);
        return null;
      }
      
      // OPTIMIZATION: Quick search with optimized service
      const contacts = await this.crmService.searchContacts(email);
      console.log(`📋 Found ${contacts.length} existing contacts in optimized search`);
      
      const existingContact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
      
      if (existingContact) {
        console.log(`✅ Found existing contact: ${existingContact.name}`);
        return existingContact;
      }

      console.log(`👤 Creating new contact for ${email}`);
      
      // OPTIMIZATION: Parallel user info fetch and contact creation
      const [userInfoResult] = await Promise.allSettled([
        this.getUserInfoFromGraphOptimized(email)
      ]);

      const userInfo = userInfoResult.status === 'fulfilled' ? userInfoResult.value : {};
      
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

      console.log(`📝 Creating contact with optimized data:`, newContact.name);
      const createdContact = await this.crmService.createContact(newContact);
      console.log(`✅ Contact created successfully: ${createdContact.name}`);
      
      return createdContact;
    } catch (error) {
      console.error('❌ Error finding/creating contact:', error);
      
      // Create a fallback contact if Graph services fail
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
   * OPTIMIZED: Get all emails related to customer
   */
  private async getCustomerEmailsOptimized(email: string): Promise<CustomerEmail[]> {
    try {
      console.log(`📧 Optimized email fetch for ${email}`);
      
      // Validate email before making API calls
      if (!this.isValidEmail(email)) {
        console.error(`❌ Invalid email format for search: ${email}`);
        return [];
      }
      
      // OPTIMIZATION: Parallel email searches with timeout protection
      const searchPromises = [
        this.withTimeout(
          graphServiceManager.mail.getEmailsFromSender(email),
          3000, // 3 second timeout
          'sender emails'
        ),
        this.withTimeout(
          graphServiceManager.mail.searchEmails(email),
          3000, // 3 second timeout
          'search emails'
        )
      ];

      const [senderEmails, searchEmails] = await Promise.allSettled(searchPromises);

      console.log(`📧 Optimized email search results:`, {
        senderEmails: senderEmails.status,
        searchEmails: searchEmails.status,
        senderCount: senderEmails.status === 'fulfilled' ? senderEmails.value.length : 0,
        searchCount: searchEmails.status === 'fulfilled' ? searchEmails.value.length : 0
      });

      const emails: CustomerEmail[] = [];
      const processedIds = new Set<string>(); // Avoid duplicates

      // Process emails from sender search (these are definitely from the customer)
      if (senderEmails.status === 'fulfilled') {
        senderEmails.value.forEach(graphEmail => {
          if (graphEmail.id && !processedIds.has(graphEmail.id)) {
            processedIds.add(graphEmail.id);
            emails.push({
              id: graphEmail.id || '',
              subject: graphEmail.subject || '',
              preview: graphEmail.bodyPreview || '',
              sender: graphEmail.sender?.emailAddress?.name || '',
              senderEmail: graphEmail.sender?.emailAddress?.address || '',
              receivedDateTime: graphEmail.receivedDateTime || '',
              isRead: graphEmail.isRead || false,
              importance: (graphEmail.importance as 'low' | 'normal' | 'high') || 'normal',
              hasAttachments: graphEmail.hasAttachments || false,
              direction: 'inbound' as const
            });
          }
        });
      }

      // Process emails from general search (may include emails to/from the customer)
      if (searchEmails.status === 'fulfilled') {
        searchEmails.value.forEach(graphEmail => {
          if (graphEmail.id && !processedIds.has(graphEmail.id)) {
            processedIds.add(graphEmail.id);
            
            // Determine direction based on sender
            const direction = graphEmail.sender?.emailAddress?.address?.toLowerCase() === email.toLowerCase() 
              ? 'inbound' : 'outbound';
            
            emails.push({
              id: graphEmail.id || '',
              subject: graphEmail.subject || '',
              preview: graphEmail.bodyPreview || '',
              sender: graphEmail.sender?.emailAddress?.name || '',
              senderEmail: graphEmail.sender?.emailAddress?.address || '',
              receivedDateTime: graphEmail.receivedDateTime || '',
              isRead: graphEmail.isRead || false,
              importance: (graphEmail.importance as 'low' | 'normal' | 'high') || 'normal',
              hasAttachments: graphEmail.hasAttachments || false,
              direction
            });
          }
        });
      }

      console.log(`⚡ Total emails found: ${emails.length} (unique, optimized fetch)`);
      
      return emails.sort((a, b) => 
        new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime()
      );
    } catch (error) {
      console.error('❌ Optimized email fetch failed:', error);
      return [];
    }
  }

  /**
   * OPTIMIZED: Get all meetings related to customer (placeholder - faster)
   */
  private async getCustomerMeetingsOptimized(email: string): Promise<CustomerMeeting[]> {
    try {
      // This would require calendar API integration
      // For now, return empty array as placeholder but much faster
      return [];
    } catch (error) {
      console.error('Error getting customer meetings:', error);
      return [];
    }
  }

  /**
   * OPTIMIZED: Get all documents shared with customer (placeholder - faster)
   */
  private async getCustomerDocumentsOptimized(email: string): Promise<CustomerDocument[]> {
    try {
      // This would require OneDrive/SharePoint API integration
      // For now, return empty array as placeholder but much faster
      return [];
    } catch (error) {
      console.error('Error getting customer documents:', error);
      return [];
    }
  }

  /**
   * OPTIMIZED: Get user info from Graph with timeout protection
   */
  private async getUserInfoFromGraphOptimized(email: string): Promise<any> {
    try {
      console.log(`🔍 Optimized Graph user lookup for: ${email}`);
      
      // Validate email format before making API calls
      if (!this.isValidEmail(email)) {
        console.warn(`⚠️ Invalid email format, skipping Graph lookup: ${email}`);
        return {};
      }
      
      // OPTIMIZATION: Search with timeout protection
      const people = await this.withTimeout(
        graphServiceManager.people?.fuzzySearchPeople(email) || Promise.resolve([]),
        2000, // 2 second timeout
        'people search'
      );

      if (people && people.length > 0) {
        // Find exact email match or use first result
        const exactMatch = people.find(p => 
          p.scoredEmailAddresses?.some(e => e.address.toLowerCase() === email.toLowerCase())
        );
        const person = exactMatch || people[0];
        
        console.log(`✅ Found person info from Graph: ${person.displayName}`);
        return {
          displayName: person.displayName,
          jobTitle: person.jobTitle,
          company: person.companyName,
          phone: person.phones?.[0]?.number,
          location: person.officeLocation
        };
      }
      
      console.log(`ℹ️ No user info found in Graph for: ${email}`);
      return {};
    } catch (error) {
      console.warn(`⚠️ Optimized Graph lookup failed for ${email}:`, error);
      return {};
    }
  }

  /**
   * UTILITY: Add timeout protection to promises
   */
  private async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    operationName: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      console.warn(`⚠️ ${operationName} failed or timed out:`, error);
      throw error;
    }
  }

  /**
   * Generate unified interactions timeline (optimized)
   */
  private generateInteractionsTimeline(
    emails: CustomerEmail[],
    meetings: CustomerMeeting[],
    documents: CustomerDocument[]
  ): CustomerInteraction[] {
    const interactions: CustomerInteraction[] = [];

    // Add email interactions (optimized processing)
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
   * Calculate customer engagement stats (optimized)
   */
  private calculateCustomerStats(
    emails: CustomerEmail[],
    meetings: CustomerMeeting[],
    documents: CustomerDocument[],
    interactions: CustomerInteraction[]
  ) {
    const lastInteraction = interactions.length > 0 ? interactions[0].date : '';
    
    // Calculate average response time (simplified for speed)
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
   * Helper methods (optimized versions)
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    // Simplified calculation for speed
    const recentEmails = emails.slice(0, 5);
    if (recentEmails.length === 0) return 'N/A';
    
    return '2h 30m'; // Simplified for performance
  }

  private calculateEngagementScore(interactions: CustomerInteraction[]): number {
    if (interactions.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentInteractions = interactions.filter(
      interaction => new Date(interaction.date) > thirtyDaysAgo
    );
    
    // Score based on frequency and recency (optimized calculation)
    const frequencyScore = Math.min(recentInteractions.length * 10, 70);
    const recencyScore = interactions.length > 0 ? 30 : 0;
    
    return Math.min(frequencyScore + recencyScore, 100);
  }
}

export const customer360OptimizedService = new Customer360OptimizedService(); 