import { graphClientService } from '../core/GraphClientService';
import { GraphContact, ContactsSearchOptions, GraphApiResponse } from '../types';

export class ContactsService {
  private static instance: ContactsService;
  private readonly baseEndpoint = '/me/contacts';

  private constructor() {}

  public static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  // Get all contacts
  async getContacts(options?: ContactsSearchOptions): Promise<GraphContact[]> {
    const endpoint = options?.folderId 
      ? `/me/contactFolders/${options.folderId}/contacts`
      : this.baseEndpoint;

    return await graphClientService.makePaginatedRequest<GraphContact>(endpoint, {
      select: options?.select || [
        'id', 'displayName', 'givenName', 'surname', 'emailAddresses',
        'businessPhones', 'mobilePhone', 'jobTitle', 'companyName',
        'department', 'officeLocation', 'businessAddress', 'personalNotes',
        'categories', 'createdDateTime', 'lastModifiedDateTime'
      ],
      filter: options?.filter,
      orderBy: options?.orderBy || 'displayName',
      top: options?.top || 100,
      maxPages: 5
    });
  }

  // Get a specific contact by ID
  async getContact(contactId: string): Promise<GraphContact> {
    return await graphClientService.makeRequest<GraphContact>(`${this.baseEndpoint}/${contactId}`, {
      select: [
        'id', 'displayName', 'givenName', 'surname', 'emailAddresses',
        'businessPhones', 'homePhones', 'mobilePhone', 'jobTitle', 'companyName',
        'department', 'officeLocation', 'businessAddress', 'homeAddress',
        'personalNotes', 'categories', 'createdDateTime', 'lastModifiedDateTime'
      ]
    });
  }

  // Search contacts
  async searchContacts(searchTerm: string, options?: Omit<ContactsSearchOptions, 'search'>): Promise<GraphContact[]> {
    const filter = `startswith(displayName,'${searchTerm}') or startswith(givenName,'${searchTerm}') or startswith(surname,'${searchTerm}') or startswith(companyName,'${searchTerm}')`;
    
    return await this.getContacts({
      ...options,
      filter: options?.filter ? `(${options.filter}) and (${filter})` : filter
    });
  }

  // Create a new contact
  async createContact(contact: Partial<GraphContact>): Promise<GraphContact> {
    return await graphClientService.makeRequest<GraphContact>(this.baseEndpoint, {
      method: 'POST',
      body: contact
    });
  }

  // Update an existing contact
  async updateContact(contactId: string, updates: Partial<GraphContact>): Promise<GraphContact> {
    return await graphClientService.makeRequest<GraphContact>(`${this.baseEndpoint}/${contactId}`, {
      method: 'PATCH',
      body: updates
    });
  }

  // Delete a contact
  async deleteContact(contactId: string): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${contactId}`, {
      method: 'DELETE'
    });
  }

  // Get contacts by company
  async getContactsByCompany(companyName: string): Promise<GraphContact[]> {
    return await this.getContacts({
      filter: `companyName eq '${companyName}'`,
      orderBy: 'displayName'
    });
  }

  // Get contacts by category
  async getContactsByCategory(category: string): Promise<GraphContact[]> {
    return await this.getContacts({
      filter: `categories/any(c:c eq '${category}')`,
      orderBy: 'displayName'
    });
  }

  // Get recently modified contacts
  async getRecentlyModifiedContacts(days: number = 30): Promise<GraphContact[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const isoDate = date.toISOString();

    return await this.getContacts({
      filter: `lastModifiedDateTime ge ${isoDate}`,
      orderBy: 'lastModifiedDateTime desc'
    });
  }

  // Get contact folders
  async getContactFolders(): Promise<any[]> {
    return await graphClientService.makePaginatedRequest('/me/contactFolders', {
      select: ['id', 'displayName', 'childFolderCount'],
      orderBy: 'displayName'
    });
  }

  // Add contact to category
  async addContactToCategory(contactId: string, category: string): Promise<GraphContact> {
    const contact = await this.getContact(contactId);
    const categories = contact.categories || [];
    
    if (!categories.includes(category)) {
      categories.push(category);
      return await this.updateContact(contactId, { categories });
    }
    
    return contact;
  }

  // Remove contact from category
  async removeContactFromCategory(contactId: string, category: string): Promise<GraphContact> {
    const contact = await this.getContact(contactId);
    const categories = (contact.categories || []).filter(c => c !== category);
    
    return await this.updateContact(contactId, { categories });
  }
}

export const contactsService = ContactsService.getInstance(); 