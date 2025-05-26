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
      scopes: [
        'User.Read',
        'Mail.Read',
        'Mail.ReadWrite',
        'Contacts.Read',
        'Contacts.ReadWrite',
        'People.Read'
      ],
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
    // Create client with dynamic token provider instead of static token
    this.client = Client.init({
      authProvider: async (done) => {
        try {
          const token = await this.authService.getAccessToken(this.config.scopes);
          if (!token) {
            done(new Error('No access token available for Microsoft Graph'), null);
            return;
          }
          done(null, token);
        } catch (error) {
          done(error, null);
        }
      },
      // Don't include version in baseUrl - the client handles this automatically
      baseUrl: this.config.baseUrl,
      // Set the default version
      defaultVersion: this.config.version,
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
    try {
      const client = await this.getClient();
      
      // Normalize endpoint - remove leading slash if present since client.api() expects it without
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      
      console.log(`🔍 Making Graph API request to: ${normalizedEndpoint}`);
      
      let request = client.api(normalizedEndpoint);

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
      console.error(`❌ Graph API request failed for ${endpoint}:`, error);
      
      // If it's an authentication error, try refreshing the client
      if (error && typeof error === 'object' && 'code' in error) {
        const graphError = error as any;
        if (graphError.code === 'InvalidAuthenticationToken' || graphError.code === 'Unauthorized') {
          console.log('🔄 Authentication error detected, refreshing client...');
          try {
            await this.refreshClient();
            // Retry the request once with the new client
            const client = await this.getClient();
            const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
            let request = client.api(normalizedEndpoint);
            
            // Reapply query parameters
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
            if (options?.headers) {
              Object.entries(options.headers).forEach(([key, value]) => {
                request = request.header(key, value);
              });
            }
            
            console.log('🔄 Retrying request after token refresh...');
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
          } catch (retryError) {
            console.error('❌ Retry after token refresh also failed:', retryError);
            throw retryError;
          }
        }
      }
      
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
      let currentEndpoint = nextLink;
      let requestOptions: {
        select?: string[];
        filter?: string;
        orderBy?: string;
        top?: number;
      } = {
        select: options?.select,
        filter: options?.filter,
        orderBy: options?.orderBy,
        top: options?.top,
      };

      // If nextLink is a full URL (from @odata.nextLink), extract just the path
      if (nextLink.startsWith('https://')) {
        try {
          const url = new URL(nextLink);
          // Remove the version from the path since our client handles it
          let pathname = url.pathname;
          if (pathname.startsWith('/v1.0/')) {
            pathname = pathname.substring(5); // Remove '/v1.0'
          } else if (pathname.startsWith('/beta/')) {
            pathname = pathname.substring(6); // Remove '/beta'
          }
          currentEndpoint = pathname + url.search;
          // Don't apply additional query parameters for nextLink URLs
          requestOptions = {};
        } catch (error) {
          console.warn('Failed to parse nextLink URL:', nextLink);
        }
      }

      const response: {
        value: T[];
        '@odata.nextLink'?: string;
      } = await this.makeRequest<{
        value: T[];
        '@odata.nextLink'?: string;
      }>(currentEndpoint, requestOptions);

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
    return await this.makeRequest('me', {
      select: ['id', 'displayName', 'mail', 'userPrincipalName', 'jobTitle', 'department']
    });
  }
}

// Export singleton instance
export const graphClientService = GraphClientService.getInstance(); 