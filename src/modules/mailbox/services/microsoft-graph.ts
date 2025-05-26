import { 
  GraphAuthService, 
  MailService, 
  GraphClientService 
} from '@/shared/services/microsoft-graph';

// Create singleton instances
const graphAuthService = new GraphAuthService();
const mailService = new MailService();
const graphClientService = new GraphClientService();
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';
import { AccountInfo } from '@azure/msal-browser';

// Legacy wrapper for backward compatibility with existing mailbox components
export class MicrosoftGraphService {
  constructor() {
    // Initialize the centralized auth service
    graphAuthService.initialize();
  }

  async initialize(): Promise<void> {
    await graphAuthService.initialize();
  }

  async signIn() {
    return await graphAuthService.signIn();
  }

  async signOut(): Promise<void> {
    await graphAuthService.signOut();
  }

  async getAccessToken(): Promise<string | null> {
    return await graphAuthService.getAccessToken();
  }

  getCurrentAccount(): AccountInfo | null {
    return graphAuthService.getCurrentAccount();
  }

  isSignedIn(): boolean {
    return graphAuthService.isSignedIn();
  }

  // Delegate to centralized mail service
  async getEmails(folderId: string = 'inbox', top: number = 50): Promise<Message[]> {
    return await mailService.getEmails(folderId, top);
  }

  async getMailFolders(): Promise<MailFolder[]> {
    return await mailService.getMailFolders();
  }

  async markAsRead(messageId: string): Promise<void> {
    await mailService.markAsRead(messageId);
  }

  async setFlag(messageId: string, flagged: boolean): Promise<void> {
    await mailService.setFlag(messageId, flagged);
  }

  async getUserProfile() {
    return await graphClientService.getCurrentUser();
  }

  async handleRedirectPromise() {
    return await graphAuthService.handleRedirectPromise();
  }

  // Legacy property for backward compatibility
  get msalInstance() {
    return (graphAuthService as any).msalInstance;
  }

  // Legacy method for backward compatibility
  setupGraphClient(accessToken: string): void {
    // This is now handled automatically by the centralized service
    console.log('setupGraphClient called - now handled by centralized service');
  }
}

// Export singleton instance for backward compatibility
export const microsoftGraphService = new MicrosoftGraphService(); 