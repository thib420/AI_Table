import { graphClientService } from '../core/GraphClientService';
import { GraphPerson, PeopleSearchOptions } from '../types';

export class PeopleService {
  private readonly baseEndpoint = '/me/people';

  // Helper function to escape single quotes for OData
  private escapeODataString(str: string): string {
    return str.replace(/'/g, "''");
  }

  // Get people most relevant to the user
  async getRelevantPeople(options?: PeopleSearchOptions): Promise<GraphPerson[]> {
    return await graphClientService.makePaginatedRequest<GraphPerson>(this.baseEndpoint, {
      select: options?.select || [
        'id', 'displayName', 'givenName', 'surname', 'scoredEmailAddresses',
        'phones', 'jobTitle', 'companyName', 'department', 'officeLocation',
        'userPrincipalName', 'personType', 'isFavorite'
      ],
      filter: options?.filter,
      orderBy: options?.orderBy,
      top: options?.top || 50,
      maxPages: 3
    });
  }

  // Search for people
  async searchPeople(searchTerm: string, options?: Omit<PeopleSearchOptions, 'search'>): Promise<GraphPerson[]> {
    return await graphClientService.makePaginatedRequest<GraphPerson>(this.baseEndpoint, {
      select: options?.select || [
        'id', 'displayName', 'givenName', 'surname', 'scoredEmailAddresses',
        'phones', 'jobTitle', 'companyName', 'department', 'officeLocation',
        'userPrincipalName', 'personType'
      ],
      filter: options?.filter,
      orderBy: options?.orderBy,
      top: options?.top || 25,
      maxPages: 2,
    });
  }

  // Get people working with a specific user
  async getPeopleWorkingWith(userId: string, options?: PeopleSearchOptions): Promise<GraphPerson[]> {
    const endpoint = `/users/${userId}/people`;
    
    return await graphClientService.makePaginatedRequest<GraphPerson>(endpoint, {
      select: options?.select || [
        'id', 'displayName', 'givenName', 'surname', 'scoredEmailAddresses',
        'phones', 'jobTitle', 'companyName', 'department', 'officeLocation',
        'userPrincipalName', 'personType'
      ],
      filter: options?.filter,
      orderBy: options?.orderBy,
      top: options?.top || 25,
      maxPages: 2
    });
  }

  // Get people by company
  async getPeopleByCompany(companyName: string): Promise<GraphPerson[]> {
    return await this.getRelevantPeople({
      filter: `companyName eq '${this.escapeODataString(companyName)}'`,
      orderBy: 'displayName'
    });
  }

  // Get people by department
  async getPeopleByDepartment(department: string): Promise<GraphPerson[]> {
    return await this.getRelevantPeople({
      filter: `department eq '${this.escapeODataString(department)}'`,
      orderBy: 'displayName'
    });
  }

  // Get people by job title
  async getPeopleByJobTitle(jobTitle: string): Promise<GraphPerson[]> {
    return await this.getRelevantPeople({
      filter: `jobTitle eq '${this.escapeODataString(jobTitle)}'`,
      orderBy: 'displayName'
    });
  }

  // Get organization users (requires Directory.Read.All permission)
  async getOrganizationPeople(options?: PeopleSearchOptions): Promise<GraphPerson[]> {
    return await this.getRelevantPeople({
      ...options,
      filter: options?.filter 
        ? `${options.filter} and personType/class eq 'Person' and personType/subclass eq 'OrganizationUser'`
        : `personType/class eq 'Person' and personType/subclass eq 'OrganizationUser'`
    });
  }

  // Get external contacts
  async getExternalContacts(options?: PeopleSearchOptions): Promise<GraphPerson[]> {
    return await this.getRelevantPeople({
      ...options,
      filter: options?.filter 
        ? `${options.filter} and personType/class eq 'Person' and personType/subclass eq 'PersonalContact'`
        : `personType/class eq 'Person' and personType/subclass eq 'PersonalContact'`
    });
  }

  // Get people with high relevance scores
  async getHighRelevancePeople(minScore: number = 8): Promise<GraphPerson[]> {
    const people = await this.getRelevantPeople({
      top: 100
    });

    return people.filter(person => 
      person.scoredEmailAddresses?.some(email => email.relevanceScore >= minScore)
    );
  }

  // Get people by email domain
  async getPeopleByEmailDomain(domain: string): Promise<GraphPerson[]> {
    const people = await this.getRelevantPeople({
      top: 200
    });

    return people.filter(person =>
      person.scoredEmailAddresses?.some(email => 
        email.address.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
      )
    );
  }

  // Get trending people (people you've been interacting with recently)
  async getTrendingPeople(): Promise<GraphPerson[]> {
    return await this.getRelevantPeople({
      orderBy: 'scoredEmailAddresses/relevanceScore desc',
      top: 20
    });
  }

  // Fuzzy search for people
  async fuzzySearchPeople(searchTerm: string): Promise<GraphPerson[]> {
    // Microsoft Graph People API supports fuzzy matching automatically
    const endpoint = `${this.baseEndpoint}?$search="${encodeURIComponent(searchTerm)}"`;
    
    return await graphClientService.makePaginatedRequest<GraphPerson>(endpoint, {
      select: [
        'id', 'displayName', 'givenName', 'surname', 'scoredEmailAddresses',
        'phones', 'jobTitle', 'companyName', 'department', 'officeLocation',
        'userPrincipalName', 'personType'
      ],
      top: 25,
      maxPages: 2
    });
  }
}

export const peopleService = new PeopleService(); 