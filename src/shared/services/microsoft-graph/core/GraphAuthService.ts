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
  private msalInstance: PublicClientApplication;
  private currentScopes: string[];

  constructor(scopes: string[] = DEFAULT_SCOPES) {
    this.msalInstance = new PublicClientApplication(msalConfig);
    this.currentScopes = scopes;
  }

  async initialize(): Promise<void> {
    await this.msalInstance.initialize();
  }

  async signIn(additionalScopes?: string[]): Promise<AuthenticationResult | null> {
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
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await this.msalInstance.logoutRedirect({
        account: accounts[0],
      });
    }
  }

  async getAccessToken(additionalScopes?: string[]): Promise<string | null> {
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
}

// Singleton instance
export const graphAuthService = new GraphAuthService(); 