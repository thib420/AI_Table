import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { GraphServiceConfig } from '../types';

// MSAL configuration
const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '60b4dc1e-3b6a-4f78-a84c-d02984c1ba7c';

const msalConfig = {
  auth: {
    clientId: clientId,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  },
  cache: {
    cacheLocation: 'sessionStorage' as const,
    storeAuthStateInCookie: false,
  },
};

// Extended scopes for CRM functionality
const DEFAULT_SCOPES = [
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Contacts.Read',
  'Contacts.ReadWrite',
  'People.Read',
  'People.Read.All',
  'User.ReadBasic.All',
  'Directory.Read.All'
];

export class GraphAuthService {
  private static instance: GraphAuthService;
  private msalInstance: PublicClientApplication;
  private currentScopes: string[];
  private initialized = false;

  private constructor(scopes: string[] = DEFAULT_SCOPES) {
    this.msalInstance = new PublicClientApplication(msalConfig);
    this.currentScopes = scopes;
  }

  // Singleton pattern
  public static getInstance(scopes?: string[]): GraphAuthService {
    if (!GraphAuthService.instance) {
      GraphAuthService.instance = new GraphAuthService(scopes);
    }
    return GraphAuthService.instance;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      console.log('🔧 Initializing GraphAuthService...');
      await this.msalInstance.initialize();
      this.initialized = true;
      console.log('✅ GraphAuthService initialized');
    }
  }

  async signIn(additionalScopes?: string[]): Promise<AuthenticationResult | null> {
    await this.initialize();
    const scopes = additionalScopes ? [...this.currentScopes, ...additionalScopes] : this.currentScopes;
    
    try {
      await this.msalInstance.loginRedirect({ scopes });
      return null; // Redirect doesn't return immediately
    } catch (error) {
      console.error('Graph sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.initialize();
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await this.msalInstance.logoutRedirect({
        account: accounts[0],
      });
    }
  }

  async getAccessToken(additionalScopes?: string[]): Promise<string | null> {
    await this.initialize();
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      return null;
    }

    const scopes = additionalScopes ? [...this.currentScopes, ...additionalScopes] : this.currentScopes;

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        scopes,
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition error:', error);
      // If silent acquisition fails, try interactive
      try {
        const response = await this.msalInstance.acquireTokenPopup({ scopes });
        return response.accessToken;
      } catch (interactiveError) {
        console.error('Interactive token acquisition error:', interactiveError);
        return null;
      }
    }
  }

  getCurrentAccount(): AccountInfo | null {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  isSignedIn(): boolean {
    return this.msalInstance.getAllAccounts().length > 0;
  }

  async handleRedirectPromise(): Promise<AuthenticationResult | null> {
    await this.initialize();
    return await this.msalInstance.handleRedirectPromise();
  }

  // Method to check if specific scopes are available
  async hasScopes(requiredScopes: string[]): Promise<boolean> {
    const token = await this.getAccessToken(requiredScopes);
    return token !== null;
  }

  // Method to request additional scopes
  async requestAdditionalScopes(scopes: string[]): Promise<string | null> {
    return await this.getAccessToken(scopes);
  }

  // Expose MSAL instance for backward compatibility
  get msalInstance_DEPRECATED() {
    console.warn('⚠️ Direct access to msalInstance is deprecated. Use GraphAuthService methods instead.');
    return this.msalInstance;
  }
}

// Export singleton instance
export const graphAuthService = GraphAuthService.getInstance(); 