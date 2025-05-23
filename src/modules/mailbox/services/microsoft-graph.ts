import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';

// MSAL configuration
const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '60b4dc1e-3b6a-4f78-a84c-d02984c1ba7c';
console.log('🔐 Microsoft Client ID check:', { 
  clientId: clientId ? `${clientId.substring(0, 8)}...` : 'MISSING',
  hasClientId: !!clientId,
  envValue: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ? 'SET' : 'NOT_SET'
});

const msalConfig = {
  auth: {
    clientId: clientId,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Required scopes for Microsoft Graph
const loginRequest = {
  scopes: ['User.Read', 'Mail.Read', 'Mail.ReadWrite'],
};

export class MicrosoftGraphService {
  public msalInstance: PublicClientApplication;
  private graphClient: Client | null = null;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async initialize(): Promise<void> {
    await this.msalInstance.initialize();
  }

  async signIn(): Promise<AuthenticationResult | null> {
    try {
      // Use redirect instead of popup for better compatibility
      await this.msalInstance.loginRedirect(loginRequest);
      return null; // Redirect doesn't return immediately
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await this.msalInstance.logoutRedirect({
        account: accounts[0],
      });
    } else {
      // Clear local state if no accounts
      this.graphClient = null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      return null;
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      this.setupGraphClient(response.accessToken);
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition error:', error);
      // If silent acquisition fails, try interactive
      try {
        const response = await this.msalInstance.acquireTokenPopup(loginRequest);
        this.setupGraphClient(response.accessToken);
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

  public setupGraphClient(accessToken: string): void {
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  async getEmails(folderId: string = 'inbox', top: number = 50): Promise<Message[]> {
    if (!this.graphClient) {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
    }

    try {
      const messages = await this.graphClient!
        .api(`/me/mailFolders/${folderId}/messages`)
        .top(top)
        .select('id,subject,bodyPreview,sender,receivedDateTime,isRead,flag,hasAttachments,webLink')
        .orderby('receivedDateTime desc')
        .get();

      return messages.value || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  async getMailFolders(): Promise<MailFolder[]> {
    if (!this.graphClient) {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
    }

    try {
      const folders = await this.graphClient!
        .api('/me/mailFolders')
        .select('id,displayName,childFolderCount,unreadItemCount,totalItemCount')
        .get();

      return folders.value || [];
    } catch (error) {
      console.error('Error fetching mail folders:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    if (!this.graphClient) {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
    }

    try {
      await this.graphClient!
        .api(`/me/messages/${messageId}`)
        .patch({ isRead: true });
    } catch (error) {
      console.error('Error marking email as read:', error);
      throw error;
    }
  }

  async setFlag(messageId: string, flagged: boolean): Promise<void> {
    if (!this.graphClient) {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
    }

    try {
      await this.graphClient!
        .api(`/me/messages/${messageId}`)
        .patch({
          flag: {
            flagStatus: flagged ? 'flagged' : 'notFlagged'
          }
        });
    } catch (error) {
      console.error('Error setting flag:', error);
      throw error;
    }
  }

  async getUserProfile() {
    if (!this.graphClient) {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
    }

    try {
      const user = await this.graphClient!
        .api('/me')
        .select('displayName,mail,userPrincipalName')
        .get();

      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}

// Singleton instance
export const microsoftGraphService = new MicrosoftGraphService(); 