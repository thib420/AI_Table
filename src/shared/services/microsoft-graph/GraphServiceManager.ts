import { graphAuthService } from './core/GraphAuthService';
import { graphClientService } from './core/GraphClientService';
import { contactsService } from './api/ContactsService';
import { mailService } from './api/MailService';
import { calendarService } from './api/CalendarService';
import { peopleService } from './api/PeopleService';
import { usersService } from './api/UsersService';

/**
 * Centralized Microsoft Graph Service Manager
 * Provides a single point of access to all Microsoft Graph services
 */
export class GraphServiceManager {
  private static instance: GraphServiceManager;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Service instances - using existing singletons
  public readonly auth = graphAuthService;
  public readonly client = graphClientService;
  public readonly contacts = contactsService;
  public readonly mail = mailService;
  public readonly calendar = calendarService;
  public readonly people = peopleService;
  public readonly users = usersService;

  private constructor() {
    // Services are already initialized as singletons
  }

  public static getInstance(): GraphServiceManager {
    if (!GraphServiceManager.instance) {
      GraphServiceManager.instance = new GraphServiceManager();
    }
    return GraphServiceManager.instance;
  }

  /**
   * Initialize all Microsoft Graph services in the correct order
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Microsoft Graph Service Manager...');
      
      // Initialize auth service first (required by all others)
      await this.auth.initialize();
      
      // All other services depend on auth, so they're ready now
      this.initialized = true;
      
      console.log('✅ Microsoft Graph Service Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Microsoft Graph Service Manager:', error);
      this.initializationPromise = null; // Allow retry
      throw error;
    }
  }

  /**
   * Check if the service manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the current authentication status
   */
  isAuthenticated(): boolean {
    return this.auth.isSignedIn();
  }

  /**
   * Sign in to Microsoft Graph
   */
  async signIn(): Promise<void> {
    await this.initialize();
    await this.auth.signIn();
  }

  /**
   * Sign out from Microsoft Graph
   */
  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    await this.initialize();
    return await this.client.getCurrentUser();
  }

  /**
   * Health check - verify all services are working
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    errors?: string[];
  }> {
    const results = {
      status: 'healthy' as const,
      services: {} as Record<string, boolean>,
      errors: [] as string[]
    };

    try {
      await this.initialize();
      results.services.manager = true;
    } catch (error) {
      results.services.manager = false;
      results.errors.push(`Manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check auth service
    try {
      results.services.auth = this.auth.isSignedIn();
    } catch (error) {
      results.services.auth = false;
      results.errors.push(`Auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check if we can make a basic API call (if authenticated)
    if (results.services.auth) {
      try {
        await this.getCurrentUser();
        results.services.api = true;
      } catch (error) {
        results.services.api = false;
        results.errors.push(`API: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Determine overall status
    const healthyServices = Object.values(results.services).filter(Boolean).length;
    const totalServices = Object.keys(results.services).length;
    
    if (healthyServices === totalServices) {
      results.status = 'healthy';
    } else if (healthyServices > 0) {
      results.status = 'degraded';
    } else {
      results.status = 'unhealthy';
    }

    return results;
  }
}

// Export singleton instance
export const graphServiceManager = GraphServiceManager.getInstance(); 