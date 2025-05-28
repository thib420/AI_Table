import { graphClientService } from '../core/GraphClientService';
import { GraphUser, UsersSearchOptions } from '../types';

export class UsersService {
  private readonly baseEndpoint = '/users';

  // Helper function to escape single quotes for OData
  private escapeODataString(str: string): string {
    return str.replace(/'/g, "''");
  }

  // Get all users in the organization
  async getUsers(options?: UsersSearchOptions): Promise<GraphUser[]> {
    return await graphClientService.makePaginatedRequest<GraphUser>(this.baseEndpoint, {
      select: options?.select || [
        'id', 'displayName', 'givenName', 'surname', 'mail', 'userPrincipalName',
        'jobTitle', 'department', 'officeLocation', 'businessPhones', 'mobilePhone',
        'companyName'
      ],
      filter: options?.filter,
      orderBy: options?.orderBy || 'displayName',
      top: options?.top || 100,
      maxPages: 5
    });
  }

  // Get a specific user by ID
  async getUser(userId: string): Promise<GraphUser> {
    return await graphClientService.makeRequest<GraphUser>(`${this.baseEndpoint}/${userId}`, {
      select: [
        'id', 'displayName', 'givenName', 'surname', 'mail', 'userPrincipalName',
        'jobTitle', 'department', 'officeLocation', 'businessPhones', 'mobilePhone',
        'companyName'
      ]
    });
  }

  // Get current user
  async getCurrentUser(): Promise<GraphUser> {
    return await graphClientService.makeRequest<GraphUser>('/me', {
      select: [
        'id', 'displayName', 'givenName', 'surname', 'mail', 'userPrincipalName',
        'jobTitle', 'department', 'officeLocation', 'businessPhones', 'mobilePhone',
        'companyName'
      ]
    });
  }

  // Search users
  async searchUsers(searchTerm: string, options?: Omit<UsersSearchOptions, 'search'>): Promise<GraphUser[]> {
    const escapedTerm = this.escapeODataString(searchTerm);
    const filter = `startswith(displayName,'${escapedTerm}') or startswith(givenName,'${escapedTerm}') or startswith(surname,'${escapedTerm}') or startswith(mail,'${escapedTerm}')`;
    
    return await this.getUsers({
      ...options,
      filter: options?.filter ? `(${options.filter}) and (${filter})` : filter
    });
  }

  // Get users by department
  async getUsersByDepartment(department: string): Promise<GraphUser[]> {
    return await this.getUsers({
      filter: `department eq '${this.escapeODataString(department)}'`,
      orderBy: 'displayName'
    });
  }

  // Get users by job title
  async getUsersByJobTitle(jobTitle: string): Promise<GraphUser[]> {
    return await this.getUsers({
      filter: `jobTitle eq '${this.escapeODataString(jobTitle)}'`,
      orderBy: 'displayName'
    });
  }

  // Get users by company
  async getUsersByCompany(companyName: string): Promise<GraphUser[]> {
    return await this.getUsers({
      filter: `companyName eq '${this.escapeODataString(companyName)}'`,
      orderBy: 'displayName'
    });
  }

  // Get user's manager
  async getUserManager(userId: string): Promise<GraphUser | null> {
    try {
      return await graphClientService.makeRequest<GraphUser>(`${this.baseEndpoint}/${userId}/manager`, {
        select: [
          'id', 'displayName', 'givenName', 'surname', 'mail', 'userPrincipalName',
          'jobTitle', 'department', 'officeLocation'
        ]
      });
    } catch (error) {
      // User might not have a manager
      return null;
    }
  }

  // Get user's direct reports
  async getUserDirectReports(userId: string): Promise<GraphUser[]> {
    return await graphClientService.makePaginatedRequest<GraphUser>(`${this.baseEndpoint}/${userId}/directReports`, {
      select: [
        'id', 'displayName', 'givenName', 'surname', 'mail', 'userPrincipalName',
        'jobTitle', 'department', 'officeLocation'
      ],
      orderBy: 'displayName',
      maxPages: 3
    });
  }

  // Get users by office location
  async getUsersByOfficeLocation(location: string): Promise<GraphUser[]> {
    return await this.getUsers({
      filter: `officeLocation eq '${this.escapeODataString(location)}'`,
      orderBy: 'displayName'
    });
  }

  // Get users with mobile phones
  async getUsersWithMobilePhones(): Promise<GraphUser[]> {
    return await this.getUsers({
      filter: `mobilePhone ne null`,
      orderBy: 'displayName'
    });
  }

  // Get users by email domain
  async getUsersByEmailDomain(domain: string): Promise<GraphUser[]> {
    return await this.getUsers({
      filter: `endswith(mail,'@${this.escapeODataString(domain)}')`,
      orderBy: 'displayName'
    });
  }

  // Get user's photo
  async getUserPhoto(userId: string): Promise<Blob | null> {
    try {
      return await graphClientService.makeRequest<Blob>(`${this.baseEndpoint}/${userId}/photo/$value`);
    } catch (error) {
      // User might not have a photo
      return null;
    }
  }

  // Get organization hierarchy for a user
  async getOrganizationHierarchy(userId: string): Promise<{
    user: GraphUser;
    manager: GraphUser | null;
    directReports: GraphUser[];
  }> {
    const [user, manager, directReports] = await Promise.all([
      this.getUser(userId),
      this.getUserManager(userId),
      this.getUserDirectReports(userId)
    ]);

    return {
      user,
      manager,
      directReports
    };
  }

  // Get team members (users in the same department)
  async getTeamMembers(userId: string): Promise<GraphUser[]> {
    const user = await this.getUser(userId);
    if (!user.department) {
      return [];
    }

    const teamMembers = await this.getUsersByDepartment(user.department);
    // Exclude the user themselves
    return teamMembers.filter(member => member.id !== userId);
  }

  // Get users with similar job titles
  async getUsersWithSimilarJobTitles(userId: string): Promise<GraphUser[]> {
    const user = await this.getUser(userId);
    if (!user.jobTitle) {
      return [];
    }

    const similarUsers = await this.getUsersByJobTitle(user.jobTitle);
    // Exclude the user themselves
    return similarUsers.filter(similarUser => similarUser.id !== userId);
  }
}

export const usersService = new UsersService(); 