import { 
  graphServiceManager,
  graphDataTransformers,
  withRetry
} from '@/shared/services/microsoft-graph';
import { CRMContact, CRMCompany, GraphContact } from '@/shared/services/microsoft-graph/types';
import { Contact, Deal, Company } from '../types';

export class GraphCRMService {
  // Get all CRM contacts from multiple Graph sources
  async getAllContacts(): Promise<Contact[]> {
    try {
      await graphServiceManager.initialize();
      
      console.log('🔍 Fetching contacts sequentially to avoid rate limits...');
      
      // Make requests sequentially instead of concurrently to avoid rate limits
      let allCRMContacts: CRMContact[] = [];
      
      // First, get Graph contacts (most important)
      try {
        console.log('📇 Fetching Graph contacts...');
        const graphContacts = await withRetry(() => 
          graphServiceManager.contacts.getContacts({ top: 50 }) // Reduced from default 100
        );
        if (graphContacts?.length) {
          const crmContacts = graphDataTransformers.contactsToCRM(graphContacts);
          allCRMContacts.push(...crmContacts);
          console.log(`✅ Graph contacts: ${crmContacts.length} contacts`);
        }
      } catch (error) {
        console.error('❌ Failed to fetch Graph contacts:', error);
      }

      // Add delay before next API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Then get People API data (if contacts are still needed)
      if (allCRMContacts.length < 30) { // Only fetch if we don't have enough contacts
        try {
          console.log('👥 Fetching People API data...');
          const people = await withRetry(() => 
            graphServiceManager.people?.getRelevantPeople({ top: 25 }) || Promise.resolve([]) // Reduced from 100
          );
          if (people?.length) {
            const crmPeople = graphDataTransformers.peopleToCRM(people);
            allCRMContacts.push(...crmPeople);
            console.log(`✅ People API: ${crmPeople.length} contacts`);
          }
        } catch (error) {
          console.error('❌ Failed to fetch People API data:', error);
        }

        // Add delay before next API call
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Finally get Users data (organization directory) if still needed
      if (allCRMContacts.length < 50) { // Only fetch if we still need more contacts
        try {
          console.log('🏢 Fetching organization users...');
          const users = await withRetry(() => 
            graphServiceManager.users?.getUsers({ top: 20 }) || Promise.resolve([]) // Reduced from 50
          );
          if (users?.length) {
            const crmUsers = graphDataTransformers.usersToCRM(users);
            allCRMContacts.push(...crmUsers);
            console.log(`✅ Organization users: ${crmUsers.length} contacts`);
          }
        } catch (error) {
          console.error('❌ Failed to fetch organization users:', error);
        }
      }

      // Merge duplicates and convert to CRM format
      const uniqueContacts = graphDataTransformers.mergeDuplicateContacts(allCRMContacts);
      console.log(`🔄 Merged duplicates: ${uniqueContacts.length} unique contacts`);
      
      // Enrich with real lastContact dates from emails and calendar (simplified)
      const enrichedContacts = await this.enrichContactsWithLastInteraction(uniqueContacts);
      
      const finalContacts = enrichedContacts.map(this.crmContactToContact);
      console.log(`✅ Final contacts: ${finalContacts.length} contacts ready`);
      
      return finalContacts;
    } catch (error) {
      console.error('Error fetching contacts from Graph:', error);
      // Return empty array - no fallback to mock data, only real data from Microsoft Graph
      return [];
    }
  }

  // Enrich contacts with real last interaction dates from emails and calendar
  private async enrichContactsWithLastInteraction(contacts: CRMContact[]): Promise<CRMContact[]> {
    try {
      console.log('🔍 Enriching contacts with last interaction data...');
      
      // Reduce the amount of data fetched to avoid rate limits
      let emails: any[] = [];
      let meetings: any[] = [];
      
      // Get recent emails (reduced amount)
      try {
        console.log('📧 Fetching recent emails...');
        emails = await withRetry(() => graphServiceManager.mail.getRecentEmails(30)); // Reduced from 100 to 30 days
        console.log(`✅ Found ${emails.length} recent emails`);
      } catch (error) {
        console.error('❌ Failed to fetch emails:', error);
      }
      
      // Add delay before next API call
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Get recent calendar events (reduced amount and timeframe)
      try {
        console.log('📅 Fetching recent calendar events...');
        const endTime = new Date().toISOString();
        const startTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // Reduced from 180 to 90 days
        meetings = await withRetry(() => 
          graphServiceManager.calendar.getEvents({
            startTime,
            endTime,
            top: 50, // Reduced from 200 to 50
            orderBy: 'start/dateTime desc'
          })
        );
        console.log(`✅ Found ${meetings.length} recent meetings`);
      } catch (error) {
        console.error('❌ Failed to fetch calendar events:', error);
      }

      // Create a map to track the most recent interaction for each contact
      const lastInteractionMap = new Map<string, string>();

      // Process emails to find last contact dates (only if we have emails)
      if (emails.length > 0) {
        console.log('🔄 Processing email interactions...');
        emails.forEach(email => {
          const emailDate = email.receivedDateTime || email.sentDateTime;
          if (!emailDate) return;

          // Check sender
          const senderEmail = email.sender?.emailAddress?.address?.toLowerCase();
          if (senderEmail) {
            const contact = contacts.find(c => c.email.toLowerCase() === senderEmail);
            if (contact) {
              const currentLast = lastInteractionMap.get(contact.id);
              if (!currentLast || new Date(emailDate) > new Date(currentLast)) {
                lastInteractionMap.set(contact.id, emailDate);
              }
            }
          }

          // Check recipients (for sent emails) - simplified processing
          [...(email.toRecipients || []), ...(email.ccRecipients || [])].forEach(recipient => {
            const recipientEmail = recipient.emailAddress?.address?.toLowerCase();
            if (recipientEmail) {
              const contact = contacts.find(c => c.email.toLowerCase() === recipientEmail);
              if (contact) {
                const currentLast = lastInteractionMap.get(contact.id);
                if (!currentLast || new Date(emailDate) > new Date(currentLast)) {
                  lastInteractionMap.set(contact.id, emailDate);
                }
              }
            }
          });
        });
      }

      // Process calendar events to find last meeting dates (only if we have meetings)
      if (meetings.length > 0) {
        console.log('🔄 Processing calendar interactions...');
        meetings.forEach(meeting => {
          const meetingDate = meeting.start?.dateTime;
          if (!meetingDate) return;

          // Process attendees and organizer
          const emailsToCheck = [
            ...(meeting.attendees || []).map(a => a.emailAddress?.address),
            meeting.organizer?.emailAddress?.address
          ].filter(Boolean);

          emailsToCheck.forEach(email => {
            if (email) {
              const contact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
              if (contact) {
                const currentLast = lastInteractionMap.get(contact.id);
                if (!currentLast || new Date(meetingDate) > new Date(currentLast)) {
                  lastInteractionMap.set(contact.id, meetingDate);
                }
              }
            }
          });
        });
      }

      // Update contacts with real last interaction dates
      const enrichedContacts = contacts.map(contact => {
        const lastInteraction = lastInteractionMap.get(contact.id);
        if (lastInteraction) {
          return {
            ...contact,
            lastContact: lastInteraction,
            // Update status based on recent activity
            status: this.calculateContactStatus(contact.status, lastInteraction)
          };
        }
        return contact;
      });

      console.log(`✅ Enriched ${lastInteractionMap.size} contacts with real interaction dates`);
      return enrichedContacts;

    } catch (error) {
      console.error('❌ Error enriching contacts with interaction data:', error);
      return contacts; // Return original contacts if enrichment fails
    }
  }

  // Calculate contact status based on last interaction
  private calculateContactStatus(currentStatus: string, lastInteraction: string): 'lead' | 'prospect' | 'customer' | 'inactive' {
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
    );

    // If recent interaction (within 30 days), upgrade status if needed
    if (daysSinceLastInteraction <= 30) {
      if (currentStatus === 'lead') return 'prospect';
      if (currentStatus === 'prospect') return 'customer';
      return currentStatus as any;
    }

    // If very old interaction (over 180 days), downgrade to inactive
    if (daysSinceLastInteraction > 180) {
      return 'inactive';
    }

    return currentStatus as any;
  }

  // Get a specific contact by ID
  async getContact(contactId: string): Promise<Contact | null> {
    try {
      console.log(`🔍 GraphCRMService: getContact called with ID: ${contactId}`);
      
      // Check if contactId is actually an email address - this should not happen
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactId);
      if (isEmail) {
        console.error(`❌ Email address passed to getContact instead of contact ID: ${contactId}`);
        console.error(`❌ This will cause "Id is malformed" error. Use searchContacts instead.`);
        return null;
      }
      
      // Validate that contactId looks like a proper Graph ID
      if (!contactId || contactId.trim().length === 0) {
        console.error(`❌ Empty or invalid contact ID: ${contactId}`);
        return null;
      }
      
      await graphServiceManager.initialize();
      // Try to find in different Graph sources
      const [graphContact, person, user] = await Promise.allSettled([
        graphServiceManager.contacts.getContact(contactId).catch(() => null),
        // People and Users APIs don't have direct ID lookup, would need search
        Promise.resolve(null),
        Promise.resolve(null)
      ]);

      if (graphContact.status === 'fulfilled' && graphContact.value) {
        console.log(`✅ Contact found by ID: ${graphContact.value.displayName}`);
        const crmContact = graphDataTransformers.contactToCRM(graphContact.value);
        return this.crmContactToContact(crmContact);
      }

      console.log(`ℹ️ No contact found with ID: ${contactId}`);
      return null;
    } catch (error) {
      console.error('❌ Error fetching contact:', error);
      return null;
    }
  }

  // Search contacts across all Graph sources
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    try {
      console.log(`🔍 GraphCRMService: Searching contacts for term: ${searchTerm}`);
      
      // Validate search term
      if (!searchTerm || searchTerm.trim().length === 0) {
        console.warn('⚠️ Empty search term provided');
        return [];
      }
      
      await graphServiceManager.initialize();
      const [graphContacts, people] = await Promise.allSettled([
        withRetry(() => {
          console.log(`📧 Searching Graph contacts for: ${searchTerm}`);
          return graphServiceManager.contacts.searchContacts(searchTerm);
        }),
        withRetry(() => {
          console.log(`👤 Searching People API for: ${searchTerm}`);
          return graphServiceManager.people?.fuzzySearchPeople(searchTerm) || Promise.resolve([]);
        })
      ]);

      let allCRMContacts: CRMContact[] = [];

      if (graphContacts.status === 'fulfilled') {
        console.log(`✅ Graph contacts search successful: ${graphContacts.value.length} results`);
        const crmContacts = graphDataTransformers.contactsToCRM(graphContacts.value);
        allCRMContacts.push(...crmContacts);
      } else {
        console.error('❌ Graph contacts search failed:', graphContacts.reason);
        // Check for specific errors
        if (graphContacts.reason?.message?.includes('Id is malformed')) {
          console.error('❌ Malformed ID error in contacts search - this should be fixed with email address filtering');
        }
      }

      if (people.status === 'fulfilled') {
        console.log(`✅ People API search successful: ${people.value.length} results`);
        const crmPeople = graphDataTransformers.peopleToCRM(people.value);
        allCRMContacts.push(...crmPeople);
      } else {
        console.error('❌ People API search failed:', people.reason);
      }

      const uniqueContacts = graphDataTransformers.mergeDuplicateContacts(allCRMContacts);
      console.log(`📊 Total unique contacts found: ${uniqueContacts.length}`);
      
      return uniqueContacts.map(this.crmContactToContact);
    } catch (error) {
      console.error('❌ Error searching contacts:', error);
      return [];
    }
  }

  // Get contacts by company
  async getContactsByCompany(companyName: string): Promise<Contact[]> {
    try {
      await graphServiceManager.initialize();
      const [graphContacts, people] = await Promise.allSettled([
        withRetry(() => graphServiceManager.contacts.getContactsByCompany(companyName)),
        withRetry(() => graphServiceManager.people?.getPeopleByCompany(companyName) || Promise.resolve([]))
      ]);

      let allCRMContacts: CRMContact[] = [];

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
      console.error('Error fetching contacts by company:', error);
      return [];
    }
  }

  // Get companies from contacts
  async getCompanies(): Promise<Company[]> {
    try {
      const contacts = await this.getAllContacts();
      const crmContacts = contacts.map(this.contactToCRMContact);
      const companies = graphDataTransformers.extractCompaniesFromContacts(crmContacts);
      
      return companies.map(this.crmCompanyToCompany);
    } catch (error) {
      console.error('Error extracting companies:', error);
      return [];
    }
  }

  // Get deals (derived from email and calendar interactions)
  async getDeals(): Promise<Deal[]> {
    try {
      await graphServiceManager.initialize();
      
      console.log('🔍 Fetching deal data sequentially to avoid rate limits...');
      
      let recentEmails: any[] = [];
      let upcomingMeetings: any[] = [];
      
      // Get recent emails (reduced amount)
      try {
        console.log('📧 Fetching recent emails for deals...');
        recentEmails = await withRetry(() => graphServiceManager.mail.getRecentEmails(20)); // Reduced from 30 to 20
        console.log(`✅ Found ${recentEmails.length} recent emails`);
      } catch (error) {
        console.error('❌ Failed to fetch emails for deals:', error);
      }
      
      // Add delay before next API call
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Get upcoming meetings (reduced amount)
      try {
        console.log('📅 Fetching upcoming meetings for deals...');
        upcomingMeetings = await withRetry(() => 
          graphServiceManager.calendar?.getUpcomingEvents(20) || Promise.resolve([]) // Reduced from 30 to 20
        );
        console.log(`✅ Found ${upcomingMeetings.length} upcoming meetings`);
      } catch (error) {
        console.error('❌ Failed to fetch meetings for deals:', error);
      }

      const deals: Deal[] = [];

      // Create deals from high-importance emails with external contacts
      if (recentEmails.length > 0) {
        console.log('🔄 Processing emails for deal opportunities...');
        const userDomain = await this.getCurrentUserDomain();
        const importantEmails = recentEmails.filter(email => 
          email.importance === 'high' && 
          email.sender?.emailAddress?.address &&
          !email.sender.emailAddress.address.includes(userDomain)
        );

        for (const email of importantEmails.slice(0, 5)) { // Reduced from 10 to 5 deals
          const senderEmail = email.sender?.emailAddress?.address;
          if (senderEmail) {
            try {
              const contact = await this.findContactByEmail(senderEmail);
              if (contact) {
                deals.push({
                  id: `email-deal-${email.id}`,
                  title: `${contact.company} - ${email.subject}`,
                  value: this.estimateDealValue(email.subject || ''),
                  stage: 'qualification',
                  probability: 50,
                  contact: contact.name,
                  company: contact.company,
                  closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  createdDate: email.receivedDateTime?.split('T')[0] || new Date().toISOString().split('T')[0]
                });
              }
              // Add small delay between contact lookups
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error('❌ Failed to find contact for email deal:', error);
            }
          }
        }
      }

      // Create deals from upcoming meetings with external attendees
      if (upcomingMeetings.length > 0) {
        console.log('🔄 Processing meetings for deal opportunities...');
        const userDomain = await this.getCurrentUserDomain();
        for (const meeting of upcomingMeetings.slice(0, 3)) { // Reduced from 5 to 3 deals
          const externalAttendees = meeting.attendees?.filter(attendee => 
            attendee.emailAddress?.address && 
            !attendee.emailAddress.address.includes(userDomain)
          );

          if (externalAttendees && externalAttendees.length > 0) {
            const attendeeEmail = externalAttendees[0].emailAddress?.address;
            if (attendeeEmail) {
              try {
                const contact = await this.findContactByEmail(attendeeEmail);
                if (contact) {
                  deals.push({
                    id: `meeting-deal-${meeting.id}`,
                    title: `${contact.company} - ${meeting.subject}`,
                    value: this.estimateDealValue(meeting.subject || ''),
                    stage: 'proposal',
                    probability: 75,
                    contact: contact.name,
                    company: contact.company,
                    closeDate: meeting.start?.dateTime?.split('T')[0] || new Date().toISOString().split('T')[0],
                    createdDate: meeting.createdDateTime?.split('T')[0] || new Date().toISOString().split('T')[0]
                  });
                }
                // Add small delay between contact lookups
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                console.error('❌ Failed to find contact for meeting deal:', error);
              }
            }
          }
        }
      }

      console.log(`✅ Generated ${deals.length} deal opportunities`);
      return deals;
    } catch (error) {
      console.error('Error generating deals:', error);
      return [];
    }
  }

  // Create a new contact
  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    try {
      await graphServiceManager.initialize();
      
      // Validate and clean the contact data before sending to Graph API
      const displayName = contactData.name?.trim() || 'Unknown Contact';
      const nameParts = displayName.split(' ').filter(part => part.length > 0);
      const givenName = nameParts[0] || '';
      const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Prepare the contact data with proper validation
      const graphContactData: Partial<GraphContact> = {
        displayName: displayName,
        givenName: givenName || undefined,
        surname: surname || undefined,
        emailAddresses: contactData.email?.trim() ? [{ address: contactData.email.trim() }] : [],
        businessPhones: contactData.phone?.trim() ? [contactData.phone.trim()] : [],
        jobTitle: contactData.position?.trim() || undefined,
        companyName: contactData.company?.trim() || undefined,
        officeLocation: contactData.location?.trim() || undefined,
        categories: contactData.tags?.filter(tag => tag && tag.trim().length > 0) || []
      };

      console.log('📝 Creating contact with data:', graphContactData);

      const graphContact = await graphServiceManager.contacts.createContact(graphContactData);

      console.log('✅ Graph contact created successfully:', graphContact);

      const crmContact = graphDataTransformers.contactToCRM(graphContact);
      return this.crmContactToContact(crmContact);
    } catch (error) {
      console.error('❌ Error creating contact:', error);
      // Provide more detailed error information
      if (error instanceof Error) {
        throw new Error(`Failed to create contact: ${error.message}`);
      }
      throw error;
    }
  }

  // Update a contact
  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      await graphServiceManager.initialize();
      
      // Validate and clean the update data
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

      console.log('📝 Updating contact with data:', updateData);

      const graphContact = await graphServiceManager.contacts.updateContact(contactId, updateData);

      console.log('✅ Graph contact updated successfully:', graphContact);

      const crmContact = graphDataTransformers.contactToCRM(graphContact);
      return this.crmContactToContact(crmContact);
    } catch (error) {
      console.error('❌ Error updating contact:', error);
      // Provide more detailed error information
      if (error instanceof Error) {
        throw new Error(`Failed to update contact: ${error.message}`);
      }
      throw error;
    }
  }

  // Delete a contact
  async deleteContact(contactId: string): Promise<void> {
    try {
      await graphServiceManager.initialize();
      await graphServiceManager.contacts.deleteContact(contactId);
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Helper methods
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
      source: crmContact.source
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
      source: contact.source
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
      await graphServiceManager.initialize();
      const currentUser = await graphServiceManager.users?.getCurrentUser() || await graphServiceManager.getCurrentUser();
      const email = currentUser.mail || currentUser.userPrincipalName || '';
      return email.split('@')[1] || '';
    } catch {
      return '';
    }
  }

  private async findContactByEmail(email: string): Promise<Contact | null> {
    const contacts = await this.searchContacts(email);
    return contacts.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  private estimateDealValue(subject: string): number {
    // Simple heuristic to estimate deal value based on keywords
    const keywords = subject.toLowerCase();
    
    if (keywords.includes('enterprise') || keywords.includes('contract')) return 100000;
    if (keywords.includes('proposal') || keywords.includes('quote')) return 50000;
    if (keywords.includes('meeting') || keywords.includes('demo')) return 25000;
    if (keywords.includes('follow up') || keywords.includes('discussion')) return 10000;
    
    return 5000; // Default value
  }
}

export const graphCRMService = new GraphCRMService(); 