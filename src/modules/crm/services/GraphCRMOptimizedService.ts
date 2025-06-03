import { 
  graphServiceManager,
  graphDataTransformers,
  withRetry
} from '@/shared/services/microsoft-graph';
import { CRMContact, CRMCompany, GraphContact } from '@/shared/services/microsoft-graph/types';
import { Contact, Deal, Company } from '../types';

export class GraphCRMOptimizedService {
  private requestQueue: Promise<any>[] = [];
  private readonly MAX_CONCURRENT_REQUESTS = 5;
  private readonly BATCH_DELAY = 50; // Much smaller delay

  // Optimized: Get all CRM contacts with aggressive parallelization
  async getAllContacts(): Promise<Contact[]> {
    try {
      await graphServiceManager.initialize();
      
      console.log('🚀 Fetching contacts with optimized parallel requests...');
      
      // Make ALL requests in parallel with intelligent rate limiting
      const allRequests = await this.executeBatch([
        () => this.fetchGraphContacts(),
        () => this.fetchPeopleData(),
        () => this.fetchOrganizationUsers()
      ]);

      const [graphContacts, peopleData, orgUsers] = allRequests;
      const allCRMContacts: CRMContact[] = [];

      // Process all results
      if (graphContacts.length > 0) {
        allCRMContacts.push(...graphContacts);
        console.log(`✅ Graph contacts: ${graphContacts.length} contacts`);
      }

      if (peopleData.length > 0) {
        allCRMContacts.push(...peopleData);
        console.log(`✅ People API: ${peopleData.length} contacts`);
      }

      if (orgUsers.length > 0) {
        allCRMContacts.push(...orgUsers);
        console.log(`✅ Organization users: ${orgUsers.length} contacts`);
      }

      // Merge duplicates
      const uniqueContacts = graphDataTransformers.mergeDuplicateContacts(allCRMContacts);
      console.log(`🔄 Merged duplicates: ${uniqueContacts.length} unique contacts`);
      
      // Quick enrichment with minimal API calls
      const enrichedContacts = await this.quickEnrichContacts(uniqueContacts);
      
      const finalContacts = enrichedContacts.map(this.crmContactToContact);
      console.log(`✅ Final contacts: ${finalContacts.length} contacts ready`);
      
      return finalContacts;
    } catch (error) {
      console.error('Error fetching contacts from Graph:', error);
      return [];
    }
  }

  // Fast contact fetching methods
  private async fetchGraphContacts(): Promise<CRMContact[]> {
    try {
      console.log('📇 Fetching Graph contacts...');
      const graphContacts = await withRetry(() => 
        graphServiceManager.contacts.getContacts({ top: 100 }) // Increased back to 100
      );
      if (graphContacts?.length) {
        return graphDataTransformers.contactsToCRM(graphContacts);
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch Graph contacts:', error);
      return [];
    }
  }

  private async fetchPeopleData(): Promise<CRMContact[]> {
    try {
      console.log('👥 Fetching People API data...');
      const people = await withRetry(() => 
        graphServiceManager.people?.getRelevantPeople({ top: 50 }) || Promise.resolve([])
      );
      if (people?.length) {
        return graphDataTransformers.peopleToCRM(people);
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch People API data:', error);
      return [];
    }
  }

  private async fetchOrganizationUsers(): Promise<CRMContact[]> {
    try {
      console.log('🏢 Fetching organization users...');
      const users = await withRetry(() => 
        graphServiceManager.users?.getUsers({ top: 30 }) || Promise.resolve([])
      );
      if (users?.length) {
        return graphDataTransformers.usersToCRM(users);
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch organization users:', error);
      return [];
    }
  }

  // Optimized batch execution with intelligent throttling
  private async executeBatch<T>(requests: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];
    const batches = this.chunkArray(requests, this.MAX_CONCURRENT_REQUESTS);

    for (const batch of batches) {
      try {
        const batchResults = await Promise.allSettled(
          batch.map(request => request())
        );

        // Process results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.warn('❌ Batch request failed:', result.reason);
            results.push([] as unknown as T); // Fallback to empty array
          }
        }

        // Very small delay only between batches (not individual requests)
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
        }
      } catch (error) {
        console.error('❌ Batch execution failed:', error);
        results.push([] as unknown as T);
      }
    }

    return results;
  }

  // Quick enrichment with minimal API overhead
  private async quickEnrichContacts(contacts: CRMContact[]): Promise<CRMContact[]> {
    try {
      console.log('🔍 Quick enrichment with optimized calls...');
      
      // Only fetch recent data for enrichment
      const [emails, meetings] = await Promise.allSettled([
        withRetry(() => graphServiceManager.mail.getRecentEmails(7)), // Only last 7 days for speed
        withRetry(() => {
          const endTime = new Date().toISOString();
          const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Only 7 days
          return graphServiceManager.calendar.getEvents({
            startTime,
            endTime,
            top: 20, // Much smaller number for speed
            orderBy: 'start/dateTime desc'
          });
        })
      ]);

      const recentEmails = emails.status === 'fulfilled' ? emails.value : [];
      const recentMeetings = meetings.status === 'fulfilled' ? meetings.value : [];

      // Quick interaction mapping (simplified for speed)
      const interactionMap = this.buildQuickInteractionMap(contacts, recentEmails, recentMeetings);

      // Update contacts with recent interaction data
      const enrichedContacts = contacts.map(contact => {
        const lastInteraction = interactionMap.get(contact.email.toLowerCase());
        if (lastInteraction) {
          return {
            ...contact,
            lastContact: lastInteraction.date,
            status: this.calculateQuickStatus(contact.status, lastInteraction.date)
          };
        }
        return contact;
      });

      console.log(`⚡ Quick enrichment completed for ${interactionMap.size} contacts`);
      return enrichedContacts;

    } catch (error) {
      console.error('❌ Quick enrichment failed:', error);
      return contacts; // Return original contacts if enrichment fails
    }
  }

  // Fast interaction mapping
  private buildQuickInteractionMap(
    contacts: CRMContact[], 
    emails: any[], 
    meetings: any[]
  ): Map<string, { date: string; type: string }> {
    const map = new Map<string, { date: string; type: string }>();

    // Process emails quickly
    emails.forEach(email => {
      const date = email.receivedDateTime || email.sentDateTime;
      if (!date) return;

      // Check sender
      const senderEmail = email.sender?.emailAddress?.address?.toLowerCase();
      if (senderEmail) {
        const current = map.get(senderEmail);
        if (!current || new Date(date) > new Date(current.date)) {
          map.set(senderEmail, { date, type: 'email' });
        }
      }

      // Check recipients (simplified)
      [...(email.toRecipients || [])].forEach(recipient => {
        const recipientEmail = recipient.emailAddress?.address?.toLowerCase();
        if (recipientEmail) {
          const current = map.get(recipientEmail);
          if (!current || new Date(date) > new Date(current.date)) {
            map.set(recipientEmail, { date, type: 'email' });
          }
        }
      });
    });

    // Process meetings quickly
    meetings.forEach(meeting => {
      const date = meeting.start?.dateTime;
      if (!date) return;

      [...(meeting.attendees || []), meeting.organizer].forEach(person => {
        const email = person?.emailAddress?.address?.toLowerCase();
        if (email) {
          const current = map.get(email);
          if (!current || new Date(date) > new Date(current.date)) {
            map.set(email, { date, type: 'meeting' });
          }
        }
      });
    });

    return map;
  }

  // Quick status calculation
  private calculateQuickStatus(currentStatus: string, lastInteraction: string): 'lead' | 'prospect' | 'customer' | 'inactive' {
    const daysSince = Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 7) return 'customer'; // Recent activity
    if (daysSince <= 30) return 'prospect'; // Moderate activity
    if (daysSince <= 90) return currentStatus as any; // Keep current
    return 'inactive'; // Old activity
  }

  // Optimized search with parallel requests
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    try {
      console.log(`🔍 Optimized search for: ${searchTerm}`);
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }
      
      await graphServiceManager.initialize();

      // Parallel search across all sources
      const [graphContacts, people] = await Promise.allSettled([
        withRetry(() => graphServiceManager.contacts.searchContacts(searchTerm)),
        withRetry(() => graphServiceManager.people?.fuzzySearchPeople(searchTerm) || Promise.resolve([]))
      ]);

      const allCRMContacts: CRMContact[] = [];

      if (graphContacts.status === 'fulfilled') {
        const crmContacts = graphDataTransformers.contactsToCRM(graphContacts.value);
        allCRMContacts.push(...crmContacts);
      }

      if (people.status === 'fulfilled') {
        const crmPeople = graphDataTransformers.peopleToCRM(people.value);
        allCRMContacts.push(...crmPeople);
      }

      const uniqueContacts = graphDataTransformers.mergeDuplicateContacts(allCRMContacts);
      return uniqueContacts.map(this.crmContactToContact);
    } catch (error) {
      console.error('❌ Optimized search failed:', error);
      return [];
    }
  }

  // Optimized deals fetching
  async getDeals(): Promise<Deal[]> {
    try {
      await graphServiceManager.initialize();
      
      console.log('🚀 Optimized deals fetching...');
      
      // Parallel fetch with smaller datasets
      const [recentEmails, upcomingMeetings] = await Promise.allSettled([
        withRetry(() => graphServiceManager.mail.getRecentEmails(10)), // Only 10 days
        withRetry(() => graphServiceManager.calendar?.getUpcomingEvents(15) || Promise.resolve([]))
      ]);

      const deals: Deal[] = [];
      const userDomain = await this.getCurrentUserDomain();

      // Process emails quickly
      if (recentEmails.status === 'fulfilled') {
        const importantEmails = recentEmails.value
          .filter(email => 
            email.importance === 'high' && 
            email.sender?.emailAddress?.address &&
            !email.sender.emailAddress.address.includes(userDomain)
          )
          .slice(0, 3); // Limit to 3 for speed

        for (const email of importantEmails) {
          const senderEmail = email.sender?.emailAddress?.address;
          if (senderEmail) {
            deals.push({
              id: `email-deal-${email.id}`,
              title: `${this.extractCompanyFromEmail(senderEmail)} - ${email.subject}`,
              value: this.estimateDealValue(email.subject || ''),
              stage: 'qualification',
              probability: 50,
              contact: email.sender?.emailAddress?.name || this.extractNameFromEmail(senderEmail),
              company: this.extractCompanyFromEmail(senderEmail),
              closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              createdDate: email.receivedDateTime?.split('T')[0] || new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      // Process meetings quickly
      if (upcomingMeetings.status === 'fulfilled') {
        upcomingMeetings.value.slice(0, 2).forEach(meeting => {
          const externalAttendees = meeting.attendees?.filter(attendee => 
            attendee.emailAddress?.address && 
            !attendee.emailAddress.address.includes(userDomain)
          );

          if (externalAttendees && externalAttendees.length > 0) {
            const attendeeEmail = externalAttendees[0].emailAddress?.address;
            if (attendeeEmail) {
              deals.push({
                id: `meeting-deal-${meeting.id}`,
                title: `${this.extractCompanyFromEmail(attendeeEmail)} - ${meeting.subject}`,
                value: this.estimateDealValue(meeting.subject || ''),
                stage: 'proposal',
                probability: 75,
                contact: externalAttendees[0].emailAddress?.name || this.extractNameFromEmail(attendeeEmail),
                company: this.extractCompanyFromEmail(attendeeEmail),
                closeDate: meeting.start?.dateTime?.split('T')[0] || new Date().toISOString().split('T')[0],
                createdDate: meeting.createdDateTime?.split('T')[0] || new Date().toISOString().split('T')[0]
              });
            }
          }
        });
      }

      console.log(`⚡ Generated ${deals.length} deals quickly`);
      return deals;
    } catch (error) {
      console.error('Error generating deals:', error);
      return [];
    }
  }

  // Utility methods (reused from original service)
  async getContact(contactId: string): Promise<Contact | null> {
    // Implementation similar to original but optimized
    try {
      await graphServiceManager.initialize();
      const graphContact = await graphServiceManager.contacts.getContact(contactId);
      if (graphContact) {
        const crmContact = graphDataTransformers.contactToCRM(graphContact);
        return this.crmContactToContact(crmContact);
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching contact:', error);
      return null;
    }
  }

  async getCompanies(): Promise<Company[]> {
    const contacts = await this.getAllContacts();
    const crmContacts = contacts.map(this.contactToCRMContact);
    const companies = graphDataTransformers.extractCompaniesFromContacts(crmContacts);
    return companies.map(this.crmCompanyToCompany);
  }

  // Original service methods (delegated)
  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    // Use original implementation for create operations
    try {
      await graphServiceManager.initialize();
      
      const displayName = contactData.name?.trim() || 'Unknown Contact';
      const nameParts = displayName.split(' ').filter(part => part.length > 0);
      
      const graphContactData: Partial<GraphContact> = {
        displayName,
        givenName: nameParts[0] || undefined,
        surname: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined,
        emailAddresses: contactData.email?.trim() ? [{ address: contactData.email.trim() }] : [],
        businessPhones: contactData.phone?.trim() ? [contactData.phone.trim()] : [],
        jobTitle: contactData.position?.trim() || undefined,
        companyName: contactData.company?.trim() || undefined,
        officeLocation: contactData.location?.trim() || undefined,
        categories: contactData.tags?.filter(tag => tag && tag.trim().length > 0) || []
      };

      const graphContact = await graphServiceManager.contacts.createContact(graphContactData);
      const crmContact = graphDataTransformers.contactToCRM(graphContact);
      return this.crmContactToContact(crmContact);
    } catch (error) {
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
    // Use original implementation for update operations
    try {
      await graphServiceManager.initialize();
      
      const updateData: Partial<GraphContact> = {};
      
      if (updates.name !== undefined) {
        const displayName = updates.name?.trim() || 'Unknown Contact';
        const nameParts = displayName.split(' ').filter(part => part.length > 0);
        updateData.displayName = displayName;
        updateData.givenName = nameParts[0] || undefined;
        updateData.surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
      }
      
      if (updates.email !== undefined) {
        updateData.emailAddresses = updates.email?.trim() ? [{ address: updates.email.trim() }] : [];
      }
      
      if (updates.phone !== undefined) {
        updateData.businessPhones = updates.phone?.trim() ? [updates.phone.trim()] : [];
      }
      
      if (updates.position !== undefined) {
        updateData.jobTitle = updates.position?.trim() || undefined;
      }
      
      if (updates.company !== undefined) {
        updateData.companyName = updates.company?.trim() || undefined;
      }
      
      if (updates.location !== undefined) {
        updateData.officeLocation = updates.location?.trim() || undefined;
      }
      
      if (updates.tags !== undefined) {
        updateData.categories = updates.tags?.filter(tag => tag && tag.trim().length > 0) || [];
      }

      const graphContact = await graphServiceManager.contacts.updateContact(contactId, updateData);
      const crmContact = graphDataTransformers.contactToCRM(graphContact);
      return this.crmContactToContact(crmContact);
    } catch (error) {
      throw new Error(`Failed to update contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteContact(contactId: string): Promise<void> {
    try {
      await graphServiceManager.initialize();
      await graphServiceManager.contacts.deleteContact(contactId);
    } catch (error) {
      throw new Error(`Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private crmContactToContact(crmContact: CRMContact): Contact {
    return {
      id: crmContact.id,
      name: crmContact.name,
      email: crmContact.email,
      phone: crmContact.phone,
      company: crmContact.company,
      position: crmContact.position,
      location: crmContact.location,
      status: crmContact.status,
      lastContact: crmContact.lastContact.split('T')[0],
      dealValue: crmContact.dealValue,
      avatar: crmContact.avatar,
      tags: crmContact.tags,
      source: crmContact.source,
      graphType: crmContact.graphType
    };
  }

  private contactToCRMContact(contact: Contact): CRMContact {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      position: contact.position,
      location: contact.location,
      status: contact.status,
      lastContact: contact.lastContact,
      dealValue: contact.dealValue,
      avatar: contact.avatar,
      tags: contact.tags,
      source: contact.source || 'Unknown',
      graphId: contact.id,
      graphType: (contact as any).graphType || 'unknown'
    };
  }

  private crmCompanyToCompany(crmCompany: CRMCompany): Company {
    return {
      id: crmCompany.id,
      name: crmCompany.name,
      industry: crmCompany.industry,
      size: crmCompany.size,
      location: crmCompany.location,
      website: crmCompany.website,
      contactCount: crmCompany.contactCount,
      dealValue: crmCompany.dealValue,
      status: crmCompany.status
    };
  }

  private async getCurrentUserDomain(): Promise<string> {
    try {
      const currentUser = await graphServiceManager.users?.getCurrentUser() || await graphServiceManager.getCurrentUser();
      const email = currentUser.mail || currentUser.userPrincipalName || '';
      return email.split('@')[1] || '';
    } catch {
      return '';
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

  private estimateDealValue(subject: string): number {
    const keywords = subject.toLowerCase();
    
    if (keywords.includes('enterprise') || keywords.includes('contract')) return 100000;
    if (keywords.includes('proposal') || keywords.includes('quote')) return 50000;
    if (keywords.includes('meeting') || keywords.includes('demo')) return 25000;
    if (keywords.includes('follow up') || keywords.includes('discussion')) return 10000;
    
    return 5000;
  }
}

export const graphCRMOptimizedService = new GraphCRMOptimizedService(); 