import { unifiedDataService } from '@/shared/services/UnifiedDataService';
import { Contact, Deal, Company } from '../types';
import { CRMContact } from '@/shared/services/microsoft-graph/types';
import { graphDataTransformers } from '@/shared/services/microsoft-graph';

export class UnifiedCRMService {
  /**
   * Get all contacts from unified data
   */
  async getAllContacts(): Promise<Contact[]> {
    console.log('🚀 UnifiedCRMService: Getting contacts from unified data...');
    
    const data = await unifiedDataService.getData();
    
    // Convert CRM contacts to Contact type
    const contacts = data.contacts.map(this.crmContactToContact);
    
    console.log(`✅ UnifiedCRMService: Returning ${contacts.length} contacts`);
    return contacts;
  }

  /**
   * Search contacts
   */
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const data = await unifiedDataService.getData();
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = data.contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.company.toLowerCase().includes(searchLower)
    );

    return filtered.map(this.crmContactToContact);
  }

  /**
   * Get a specific contact
   */
  async getContact(contactId: string): Promise<Contact | null> {
    const data = await unifiedDataService.getData();
    
    const contact = data.contacts.find(c => c.id === contactId);
    return contact ? this.crmContactToContact(contact) : null;
  }

  /**
   * Get deals (generated from emails and meetings)
   */
  async getDeals(): Promise<Deal[]> {
    console.log('🚀 UnifiedCRMService: Generating deals from unified data...');
    
    const data = await unifiedDataService.getData();
    const deals: Deal[] = [];
    
    // Get current user domain
    const userDomain = await this.getCurrentUserDomain();

    // Generate deals from high-importance emails
    const importantEmails = data.emails
      .filter(email => 
        email.importance === 'high' && 
        email.sender?.emailAddress?.address &&
        !email.sender.emailAddress.address.includes(userDomain)
      )
      .slice(0, 5); // Limit to 5

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

    // Generate deals from meetings with external attendees
    const upcomingMeetings = data.meetings
      .filter(meeting => new Date(meeting.start?.dateTime || 0) > new Date())
      .slice(0, 3); // Limit to 3

    for (const meeting of upcomingMeetings) {
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
    }

    console.log(`✅ UnifiedCRMService: Generated ${deals.length} deals`);
    return deals;
  }

  /**
   * Get companies (extracted from contacts)
   */
  async getCompanies(): Promise<Company[]> {
    const data = await unifiedDataService.getData();
    
    const companies = graphDataTransformers.extractCompaniesFromContacts(data.contacts);
    return companies.map(this.crmCompanyToCompany);
  }

  /**
   * Create a new contact (not implemented for unified service)
   */
  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    throw new Error('Creating contacts is not supported in unified mode. Use the original service.');
  }

  /**
   * Update a contact (not implemented for unified service)
   */
  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
    throw new Error('Updating contacts is not supported in unified mode. Use the original service.');
  }

  /**
   * Delete a contact (not implemented for unified service)
   */
  async deleteContact(contactId: string): Promise<void> {
    throw new Error('Deleting contacts is not supported in unified mode. Use the original service.');
  }

  /**
   * Helper methods
   */
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

  private crmCompanyToCompany(crmCompany: any): Company {
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
    // This is a simplified version - in production, get from Graph API
    return 'internal.com';
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

export const unifiedCRMService = new UnifiedCRMService(); 