import { 
  graphServiceManager,
  graphDataTransformers,
  withRetry
} from '@/shared/services/microsoft-graph';
import { CRMContact, CRMCompany } from '@/shared/services/microsoft-graph/types';
import { Contact, Deal, Company } from '../types';

export class GraphCRMService {
  // Get all CRM contacts from multiple Graph sources
  async getAllContacts(): Promise<Contact[]> {
    try {
      await graphServiceManager.initialize();
      const [graphContacts, people, users] = await Promise.allSettled([
        withRetry(() => graphServiceManager.contacts.getContacts()),
        withRetry(() => graphServiceManager.people?.getRelevantPeople({ top: 100 }) || Promise.resolve([])),
        withRetry(() => graphServiceManager.users?.getUsers({ top: 50 }) || Promise.resolve([]))
      ]);

      let allCRMContacts: CRMContact[] = [];

      // Transform Graph contacts
      if (graphContacts.status === 'fulfilled') {
        const crmContacts = graphDataTransformers.contactsToCRM(graphContacts.value);
        allCRMContacts.push(...crmContacts);
      }

      // Transform People API results
      if (people.status === 'fulfilled') {
        const crmPeople = graphDataTransformers.peopleToCRM(people.value);
        allCRMContacts.push(...crmPeople);
      }

      // Transform Users API results (organization directory)
      if (users.status === 'fulfilled') {
        const crmUsers = graphDataTransformers.usersToCRM(users.value);
        allCRMContacts.push(...crmUsers);
      }

      // Merge duplicates and convert to CRM format
      const uniqueContacts = graphDataTransformers.mergeDuplicateContacts(allCRMContacts);
      
      return uniqueContacts.map(this.crmContactToContact);
    } catch (error) {
      console.error('Error fetching contacts from Graph:', error);
      // Return empty array or fallback to mock data
      return [];
    }
  }

  // Get a specific contact by ID
  async getContact(contactId: string): Promise<Contact | null> {
    try {
      await graphServiceManager.initialize();
      // Try to find in different Graph sources
      const [graphContact, person, user] = await Promise.allSettled([
        graphServiceManager.contacts.getContact(contactId).catch(() => null),
        // People and Users APIs don't have direct ID lookup, would need search
        Promise.resolve(null),
        Promise.resolve(null)
      ]);

      if (graphContact.status === 'fulfilled' && graphContact.value) {
        const crmContact = graphDataTransformers.contactToCRM(graphContact.value);
        return this.crmContactToContact(crmContact);
      }

      return null;
    } catch (error) {
      console.error('Error fetching contact:', error);
      return null;
    }
  }

  // Search contacts across all Graph sources
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    try {
      await graphServiceManager.initialize();
      const [graphContacts, people] = await Promise.allSettled([
        withRetry(() => graphServiceManager.contacts.searchContacts(searchTerm)),
        withRetry(() => graphServiceManager.people?.fuzzySearchPeople(searchTerm) || Promise.resolve([]))
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
      console.error('Error searching contacts:', error);
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
      // Get recent emails and meetings to derive deal information
      const [recentEmails, upcomingMeetings] = await Promise.allSettled([
        withRetry(() => graphServiceManager.mail.getRecentEmails(30)),
        withRetry(() => graphServiceManager.calendar?.getUpcomingEvents(30) || Promise.resolve([]))
      ]);

      const deals: Deal[] = [];

      // Create deals from high-importance emails with external contacts
      if (recentEmails.status === 'fulfilled') {
        const userDomain = await this.getCurrentUserDomain();
        const importantEmails = recentEmails.value.filter(email => 
          email.importance === 'high' && 
          email.sender?.emailAddress?.address &&
          !email.sender.emailAddress.address.includes(userDomain)
        );

        for (const email of importantEmails.slice(0, 10)) { // Limit to 10 deals
          const senderEmail = email.sender?.emailAddress?.address;
          if (senderEmail) {
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
          }
        }
      }

      // Create deals from upcoming meetings with external attendees
      if (upcomingMeetings.status === 'fulfilled') {
        const userDomain = await this.getCurrentUserDomain();
        for (const meeting of upcomingMeetings.value.slice(0, 5)) { // Limit to 5 deals
          const externalAttendees = meeting.attendees?.filter(attendee => 
            attendee.emailAddress?.address && 
            !attendee.emailAddress.address.includes(userDomain)
          );

          if (externalAttendees && externalAttendees.length > 0) {
            const attendeeEmail = externalAttendees[0].emailAddress?.address;
            if (attendeeEmail) {
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
            }
          }
        }
      }

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
      const graphContact = await graphServiceManager.contacts.createContact({
        displayName: contactData.name,
        givenName: contactData.name?.split(' ')[0],
        surname: contactData.name?.split(' ').slice(1).join(' '),
        emailAddresses: contactData.email ? [{ address: contactData.email }] : [],
        businessPhones: contactData.phone ? [contactData.phone] : [],
        jobTitle: contactData.position,
        companyName: contactData.company,
        officeLocation: contactData.location,
        categories: contactData.tags || []
      });

      const crmContact = graphDataTransformers.contactToCRM(graphContact);
      return this.crmContactToContact(crmContact);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  // Update a contact
  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      await graphServiceManager.initialize();
      const graphContact = await graphServiceManager.contacts.updateContact(contactId, {
        displayName: updates.name,
        emailAddresses: updates.email ? [{ address: updates.email }] : undefined,
        businessPhones: updates.phone ? [updates.phone] : undefined,
        jobTitle: updates.position,
        companyName: updates.company,
        officeLocation: updates.location,
        categories: updates.tags
      });

      const crmContact = graphDataTransformers.contactToCRM(graphContact);
      return this.crmContactToContact(crmContact);
    } catch (error) {
      console.error('Error updating contact:', error);
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