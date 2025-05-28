import { Client } from '@microsoft/microsoft-graph-client';
import { GraphAuthService } from './GraphAuthService';
import { GraphServiceConfig } from '../types';

export class GraphClientService {
  private static instance: GraphClientService;
  private client: Client | null = null;
  private config: GraphServiceConfig;
  private authService: GraphAuthService;
  
  // Rate limiting properties
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private minRequestInterval = 100; // Minimum 100ms between requests
  private requestsInCurrentWindow = 0;
  private windowStartTime = Date.now();
  private readonly maxRequestsPerWindow = 60; // 60 requests per minute (conservative)
  private readonly windowSizeMs = 60000; // 1 minute window

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

  // Rate limiting helper methods
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset window if enough time has passed
    if (now - this.windowStartTime >= this.windowSizeMs) {
      this.requestsInCurrentWindow = 0;
      this.windowStartTime = now;
    }
    
    // Check if we've hit the rate limit
    if (this.requestsInCurrentWindow >= this.maxRequestsPerWindow) {
      const timeToWait = this.windowSizeMs - (now - this.windowStartTime);
      console.log(`🕒 Rate limit reached. Waiting ${Math.round(timeToWait)}ms...`);
      await new Promise(resolve => setTimeout(resolve, timeToWait));
      
      // Reset after waiting
      this.requestsInCurrentWindow = 0;
      this.windowStartTime = Date.now();
    }
    
    // Ensure minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestsInCurrentWindow++;
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await this.enforceRateLimit();
          await request();
        } catch (error) {
          console.error('Error processing queued request:', error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      this.requestQueue.push(wrappedRequest);
      this.processRequestQueue();
    });
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
    return this.queueRequest(async () => {
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
        
        // Handle specific rate limiting errors
        if (error && typeof error === 'object' && 'code' in error) {
          const graphError = error as any;
          
          if (graphError.code === 'TooManyRequests' || graphError.message?.includes('Too Many Requests')) {
            // Extract retry-after header if available
            const retryAfter = graphError.headers?.['retry-after'] || graphError.response?.headers?.get?.('retry-after');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute
            
            console.log(`🕒 Rate limited. Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Retry the request once
            console.log(`🔄 Retrying request after rate limit delay...`);
            return this.makeRequest(endpoint, options);
          }
          
          if (graphError.code === 'InvalidAuthenticationToken' || graphError.code === 'Unauthorized') {
            console.log('🔄 Authentication error detected, refreshing client...');
            try {
              await this.refreshClient();
              // Retry the request once with the new client
              console.log('🔄 Retrying request after token refresh...');
              return this.makeRequest(endpoint, options);
            } catch (retryError) {
              console.error('❌ Retry after token refresh also failed:', retryError);
              throw retryError;
            }
          }
        }
        
        throw error;
      }
    });
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
    const maxPages = Math.min(options?.maxPages || 5, 5); // Limit to max 5 pages to reduce API calls

    while (nextLink && pageCount < maxPages) {
      // Add delay between pagination requests (except for the first request)
      if (pageCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between pages
      }
      
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
        top: Math.min(options?.top || 50, 50), // Limit page size to 50 to reduce individual request load
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

      try {
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
        
        console.log(`📄 Fetched page ${pageCount}/${maxPages} with ${response.value.length} items (total: ${results.length})`);
      } catch (error) {
        console.error(`❌ Error fetching page ${pageCount + 1}:`, error);
        // Break the loop on error to prevent further API calls
        break;
      }
    }

    console.log(`✅ Pagination completed: ${results.length} total items from ${pageCount} pages`);
    return results;
  }

  // Method to check if client is authenticated
  isAuthenticated(): boolean {
    return this.authService.isSignedIn();
  }

  // Method to get current rate limiting statistics
  getRateLimitStatus(): {
    requestsInCurrentWindow: number;
    maxRequestsPerWindow: number;
    windowStartTime: number;
    timeUntilWindowReset: number;
    isNearLimit: boolean;
  } {
    const now = Date.now();
    const timeUntilWindowReset = Math.max(0, this.windowSizeMs - (now - this.windowStartTime));
    const isNearLimit = this.requestsInCurrentWindow > (this.maxRequestsPerWindow * 0.8); // 80% threshold
    
    return {
      requestsInCurrentWindow: this.requestsInCurrentWindow,
      maxRequestsPerWindow: this.maxRequestsPerWindow,
      windowStartTime: this.windowStartTime,
      timeUntilWindowReset,
      isNearLimit
    };
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