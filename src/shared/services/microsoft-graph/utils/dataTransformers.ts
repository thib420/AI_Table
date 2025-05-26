import { 
  GraphContact, 
  GraphPerson, 
  GraphUser, 
  CRMContact, 
  CRMCompany 
} from '../types';
import { Message, Event } from '@microsoft/microsoft-graph-types';

export const graphDataTransformers = {
  // Transform Graph Contact to CRM Contact
  contactToCRM: (contact: GraphContact): CRMContact => {
    const primaryEmail = contact.emailAddresses?.[0]?.address || '';
    const primaryPhone = contact.businessPhones?.[0] || contact.mobilePhone || '';
    const fullName = contact.displayName || `${contact.givenName || ''} ${contact.surname || ''}`.trim();

    return {
      id: contact.id,
      name: fullName,
      email: primaryEmail,
      phone: primaryPhone,
      company: contact.companyName || '',
      position: contact.jobTitle || '',
      location: contact.officeLocation || contact.businessAddress?.city || '',
      status: 'prospect', // Default status, can be updated based on business logic
      lastContact: contact.lastModifiedDateTime || contact.createdDateTime || new Date().toISOString(),
      dealValue: 0, // Default value, would need to be calculated from other sources
      avatar: undefined, // Would need to fetch from Graph photo endpoint
      tags: contact.categories || [],
      source: 'Microsoft Graph Contacts',
      graphId: contact.id,
      graphType: 'contact',
      lastModified: contact.lastModifiedDateTime,
      notes: contact.personalNotes
    };
  },

  // Transform Graph Person to CRM Contact
  personToCRM: (person: GraphPerson): CRMContact => {
    const primaryEmail = person.scoredEmailAddresses?.[0]?.address || '';
    const primaryPhone = person.phones?.[0]?.number || '';
    const fullName = person.displayName || `${person.givenName || ''} ${person.surname || ''}`.trim();

    // Determine status based on person type and relevance
    let status: 'lead' | 'prospect' | 'customer' | 'inactive' = 'prospect';
    if (person.personType?.subclass === 'OrganizationUser') {
      status = 'customer'; // Internal users are typically customers/colleagues
    } else if (person.scoredEmailAddresses?.[0]?.relevanceScore && person.scoredEmailAddresses[0].relevanceScore > 10) {
      status = 'customer'; // High relevance suggests active relationship
    }

    return {
      id: person.id,
      name: fullName,
      email: primaryEmail,
      phone: primaryPhone,
      company: person.companyName || '',
      position: person.jobTitle || '',
      location: person.officeLocation || person.postalAddresses?.[0]?.city || '',
      status,
      lastContact: new Date().toISOString(), // Would need to be calculated from email/calendar data
      dealValue: 0, // Default value
      avatar: undefined,
      tags: person.personType ? [person.personType.subclass] : [],
      source: 'Microsoft Graph People',
      graphId: person.id,
      graphType: 'person',
      notes: person.personNotes
    };
  },

  // Transform Graph User to CRM Contact
  userToCRM: (user: GraphUser): CRMContact => {
    const primaryEmail = user.mail || user.userPrincipalName || '';
    const primaryPhone = user.businessPhones?.[0] || user.mobilePhone || '';
    const fullName = user.displayName || `${user.givenName || ''} ${user.surname || ''}`.trim();

    return {
      id: user.id,
      name: fullName,
      email: primaryEmail,
      phone: primaryPhone,
      company: user.companyName || '',
      position: user.jobTitle || '',
      location: user.officeLocation || '',
      status: 'customer', // Organization users are typically customers/colleagues
      lastContact: new Date().toISOString(),
      dealValue: 0,
      avatar: undefined,
      tags: user.department ? [user.department] : [],
      source: 'Microsoft Graph Users',
      graphId: user.id,
      graphType: 'user'
    };
  },

  // Transform multiple contacts to CRM format
  contactsToCRM: (contacts: GraphContact[]): CRMContact[] => {
    return contacts.map(contact => graphDataTransformers.contactToCRM(contact));
  },

  // Transform multiple people to CRM format
  peopleToCRM: (people: GraphPerson[]): CRMContact[] => {
    return people.map(person => graphDataTransformers.personToCRM(person));
  },

  // Transform multiple users to CRM format
  usersToCRM: (users: GraphUser[]): CRMContact[] => {
    return users.map(user => graphDataTransformers.userToCRM(user));
  },

  // Extract companies from contacts
  extractCompaniesFromContacts: (contacts: CRMContact[]): CRMCompany[] => {
    const companyMap = new Map<string, CRMCompany>();

    contacts.forEach(contact => {
      if (!contact.company) return;

      const companyKey = contact.company.toLowerCase();
      if (!companyMap.has(companyKey)) {
        companyMap.set(companyKey, {
          id: `company-${companyKey.replace(/\s+/g, '-')}`,
          name: contact.company,
          industry: '', // Would need to be enriched from other sources
          size: '', // Would need to be enriched
          location: contact.location,
          website: '', // Would need to be enriched
          contactCount: 0,
          dealValue: 0,
          status: 'prospect',
          primaryContact: contact,
          employees: []
        });
      }

      const company = companyMap.get(companyKey)!;
      company.contactCount++;
      company.dealValue += contact.dealValue;

      // Update primary contact if this contact has higher deal value
      if (!company.primaryContact || contact.dealValue > company.primaryContact.dealValue) {
        company.primaryContact = contact;
      }
    });

    return Array.from(companyMap.values());
  },

  // Transform email to interaction data
  emailToInteraction: (email: Message, contactId?: string) => {
    return {
      id: email.id,
      contactId: contactId || '',
      type: 'email' as const,
      subject: email.subject || '',
      content: email.bodyPreview || '',
      timestamp: email.receivedDateTime || new Date().toISOString(),
      direction: 'inbound' as const, // Would need logic to determine direction
      metadata: {
        importance: email.importance,
        hasAttachments: email.hasAttachments,
        webLink: email.webLink,
        sender: email.sender?.emailAddress?.address
      }
    };
  },

  // Transform calendar event to interaction data
  eventToInteraction: (event: Event, contactId?: string) => {
    return {
      id: event.id,
      contactId: contactId || '',
      type: 'meeting' as const,
      subject: event.subject || '',
      content: event.body?.content || '',
      timestamp: event.start?.dateTime || new Date().toISOString(),
      direction: 'outbound' as const, // Meetings are typically outbound interactions
      metadata: {
        location: event.location?.displayName,
        attendees: event.attendees?.map(a => a.emailAddress?.address).filter(Boolean),
        duration: event.start?.dateTime && event.end?.dateTime 
          ? new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()
          : undefined,
        importance: event.importance,
        webLink: event.webLink
      }
    };
  },

  // Merge duplicate contacts based on email
  mergeDuplicateContacts: (contacts: CRMContact[]): CRMContact[] => {
    const emailMap = new Map<string, CRMContact>();
    const uniqueContacts: CRMContact[] = [];

    contacts.forEach(contact => {
      if (!contact.email) {
        uniqueContacts.push(contact);
        return;
      }

      const emailKey = contact.email.toLowerCase();
      const existing = emailMap.get(emailKey);

      if (!existing) {
        emailMap.set(emailKey, contact);
        uniqueContacts.push(contact);
      } else {
        // Merge data from duplicate contact
        existing.tags = [...new Set([...existing.tags, ...contact.tags])];
        existing.dealValue = Math.max(existing.dealValue, contact.dealValue);
        
        // Use the most recent last contact date
        if (new Date(contact.lastContact) > new Date(existing.lastContact)) {
          existing.lastContact = contact.lastContact;
        }

        // Prefer more complete data
        if (!existing.phone && contact.phone) existing.phone = contact.phone;
        if (!existing.company && contact.company) existing.company = contact.company;
        if (!existing.position && contact.position) existing.position = contact.position;
        if (!existing.location && contact.location) existing.location = contact.location;
        if (!existing.notes && contact.notes) existing.notes = contact.notes;
      }
    });

    return uniqueContacts;
  },

  // Calculate contact engagement score
  calculateEngagementScore: (contact: CRMContact, interactions?: any[]): number => {
    let score = 0;

    // Base score from deal value
    score += Math.min(contact.dealValue / 1000, 50); // Max 50 points from deal value

    // Score from recent interactions
    if (interactions) {
      const recentInteractions = interactions.filter(i => 
        new Date(i.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      );
      score += Math.min(recentInteractions.length * 5, 30); // Max 30 points from interactions
    }

    // Score from contact completeness
    const completenessFields = [contact.phone, contact.company, contact.position, contact.location];
    const completeness = completenessFields.filter(Boolean).length / completenessFields.length;
    score += completeness * 20; // Max 20 points from completeness

    return Math.round(score);
  }
};

export default graphDataTransformers; 