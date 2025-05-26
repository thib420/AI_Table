import { Client } from '@microsoft/microsoft-graph-client';
import { GraphAuthService } from './GraphAuthService';
import { GraphServiceConfig } from '../types';

export class GraphClientService {
  private static instance: GraphClientService;
  private client: Client | null = null;
  private config: GraphServiceConfig;
  private authService: GraphAuthService;

  private constructor(config?: Partial<GraphServiceConfig>) {
    this.config = {
      scopes: ['User.Read'],
      baseUrl: 'https://graph.microsoft.com',
      version: 'v1.0',
      ...config
    };
    this.authService = GraphAuthService.getInstance();
  }

  // Singleton pattern
  public static getInstance(config?: Partial<GraphServiceConfig>): GraphClientService {
    if (!GraphClientService.instance) {
      GraphClientService.instance = new GraphClientService(config);
    }
    return GraphClientService.instance;
  }

  async getClient(): Promise<Client> {
    if (!this.client) {
      await this.initializeClient();
    }
    return this.client!;
  }

  private async initializeClient(): Promise<void> {
    const token = await this.authService.getAccessToken(this.config.scopes);
    if (!token) {
      throw new Error('No access token available for Microsoft Graph');
    }

    this.client = Client.init({
      authProvider: (done) => {
        done(null, token);
      },
      baseUrl: `${this.config.baseUrl}/${this.config.version}`,
    });
  }

  async refreshClient(): Promise<void> {
    this.client = null;
    await this.initializeClient();
  }

  // Helper method to make authenticated requests
  async makeRequest<T>(endpoint: string, options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    select?: string[];
    filter?: string;
    orderBy?: string;
    top?: number;
    skip?: number;
    expand?: string[];
  }): Promise<T> {
    const client = await this.getClient();
    let request = client.api(endpoint);

    // Apply query parameters
    if (options?.select) {
      request = request.select(options.select.join(','));
    }
    if (options?.filter) {
      request = request.filter(options.filter);
    }
    if (options?.orderBy) {
      request = request.orderby(options.orderBy);
    }
    if (options?.top) {
      request = request.top(options.top);
    }
    if (options?.skip) {
      request = request.skip(options.skip);
    }
    if (options?.expand) {
      request = request.expand(options.expand.join(','));
    }

    // Add custom headers
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        request = request.header(key, value);
      });
    }

    // Execute request based on method
    try {
      switch (options?.method || 'GET') {
        case 'GET':
          return await request.get();
        case 'POST':
          return await request.post(options?.body);
        case 'PATCH':
          return await request.patch(options?.body);
        case 'DELETE':
          return await request.delete();
        default:
          throw new Error(`Unsupported HTTP method: ${options?.method}`);
      }
    } catch (error) {
      console.error(`Graph API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Helper method for paginated requests
  async makePaginatedRequest<T>(
    endpoint: string, 
    options?: {
      select?: string[];
      filter?: string;
      orderBy?: string;
      top?: number;
      maxPages?: number;
    }
  ): Promise<T[]> {
    const results: T[] = [];
    let nextLink: string | undefined = endpoint;
    let pageCount = 0;
    const maxPages = options?.maxPages || 10;

    while (nextLink && pageCount < maxPages) {
      const response: {
        value: T[];
        '@odata.nextLink'?: string;
      } = await this.makeRequest<{
        value: T[];
        '@odata.nextLink'?: string;
      }>(nextLink, {
        select: options?.select,
        filter: options?.filter,
        orderBy: options?.orderBy,
        top: options?.top,
      });

      results.push(...response.value);
      nextLink = response['@odata.nextLink'];
      pageCount++;
    }

    return results;
  }

  // Method to check if client is authenticated
  isAuthenticated(): boolean {
    return this.authService.isSignedIn();
  }

  // Method to get current user info
  async getCurrentUser() {
    return await this.makeRequest('/me', {
      select: ['id', 'displayName', 'mail', 'userPrincipalName', 'jobTitle', 'department']
    });
  }
}

// Export singleton instance
export const graphClientService = GraphClientService.getInstance(); 