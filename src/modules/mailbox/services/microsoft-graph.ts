import { graphServiceManager } from '@/shared/services/microsoft-graph/GraphServiceManager';
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';
import { AccountInfo } from '@azure/msal-browser';

// Legacy wrapper for backward compatibility with existing mailbox components
export class MicrosoftGraphService {
  private initialized = false;

  constructor() {
    // Don't initialize in constructor to avoid issues
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      console.log('🔧 Initializing Microsoft Graph Service...');
      await graphServiceManager.initialize();
      this.initialized = true;
      console.log('✅ Microsoft Graph Service initialized');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      console.log('⚠️ Service not initialized, initializing now...');
      await this.initialize();
    }
  }

  async signIn() {
    await this.ensureInitialized();
    return await graphServiceManager.signIn();
  }

  async signOut(): Promise<void> {
    await graphServiceManager.signOut();
  }

  async getAccessToken(): Promise<string | null> {
    await this.ensureInitialized();
    return await graphServiceManager.auth.getAccessToken();
  }

  getCurrentAccount(): AccountInfo | null {
    return graphServiceManager.auth.getCurrentAccount();
  }

  isSignedIn(): boolean {
    return graphServiceManager.auth.isSignedIn();
  }

  // Delegate to centralized mail service
  async getEmails(folderId: string = 'inbox', top: number = 50): Promise<Message[]> {
    console.log('🔍 MicrosoftGraphService.getEmails called', { folderId, top, isSignedIn: this.isSignedIn() });
    await this.ensureInitialized();
    console.log('✅ Service initialized, calling mail service');
    try {
      const result = await graphServiceManager.mail.getEmails(folderId, top);
      console.log('📧 Got emails from mail service:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error in mail service:', error);
      throw error;
    }
  }

  async getMailFolders(): Promise<MailFolder[]> {
    await this.ensureInitialized();
    return await graphServiceManager.mail.getMailFolders();
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.ensureInitialized();
    await graphServiceManager.mail.markAsRead(messageId);
  }

  async setFlag(messageId: string, flagged: boolean): Promise<void> {
    await this.ensureInitialized();
    await graphServiceManager.mail.setFlag(messageId, flagged);
  }

  async deleteEmail(messageId: string): Promise<void> {
    await this.ensureInitialized();
    await graphServiceManager.mail.deleteEmail(messageId);
  }

  async moveEmail(messageId: string, destinationFolderId: string): Promise<any> {
    await this.ensureInitialized();
    return await graphServiceManager.mail.moveEmail(messageId, destinationFolderId);
  }

  async getUserProfile() {
    await this.ensureInitialized();
    return await graphServiceManager.getCurrentUser();
  }

  async handleRedirectPromise() {
    await this.ensureInitialized();
    return await graphServiceManager.auth.handleRedirectPromise();
  }

  // Legacy property for backward compatibility
  get msalInstance() {
    return graphServiceManager.auth.msalInstance_DEPRECATED;
  }

  // Legacy method for backward compatibility
  setupGraphClient(accessToken: string): void {
    // This is now handled automatically by the centralized service
    console.log('setupGraphClient called - now handled by centralized service');
  }
}

// Export singleton instance for backward compatibility
export const microsoftGraphService = new MicrosoftGraphService(); 