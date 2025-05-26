import { graphClientService } from '../core/GraphClientService';
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';

export class MailService {
  private static instance: MailService;
  private readonly baseEndpoint = '/me/messages';

  private constructor() {}

  public static getInstance(): MailService {
    if (!MailService.instance) {
      MailService.instance = new MailService();
    }
    return MailService.instance;
  }

  // Get emails from a specific folder
  async getEmails(folderId: string = 'inbox', top: number = 50): Promise<Message[]> {
    console.log(`📧 MailService.getEmails called with folderId: ${folderId}, top: ${top}`);
    
    const endpoint = folderId === 'inbox' 
      ? '/me/messages'
      : `/me/mailFolders/${folderId}/messages`;

    console.log(`📧 Using endpoint: ${endpoint}`);

    try {
      const result = await graphClientService.makePaginatedRequest<Message>(endpoint, {
        select: [
          'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime', 
          'isRead', 'flag', 'hasAttachments', 'webLink', 'importance',
          'toRecipients', 'ccRecipients'
        ],
        orderBy: 'receivedDateTime desc',
        top,
        maxPages: 3
      });
      
      console.log(`✅ MailService.getEmails successful: ${result.length} messages`);
      return result;
    } catch (error) {
      console.error(`❌ MailService.getEmails failed for endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  // Get a specific email by ID
  async getEmail(messageId: string): Promise<Message> {
    return await graphClientService.makeRequest<Message>(`${this.baseEndpoint}/${messageId}`, {
      select: [
        'id', 'subject', 'body', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink', 'importance',
        'toRecipients', 'ccRecipients', 'attachments'
      ],
      expand: ['attachments']
    });
  }

  // Search emails
  async searchEmails(searchTerm: string, folderId?: string): Promise<Message[]> {
    const endpoint = folderId 
      ? `/me/mailFolders/${folderId}/messages`
      : this.baseEndpoint;

    return await graphClientService.makePaginatedRequest<Message>(endpoint, {
      filter: `contains(subject,'${searchTerm}') or contains(bodyPreview,'${searchTerm}')`,
      select: [
        'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink'
      ],
      orderBy: 'receivedDateTime desc',
      top: 50,
      maxPages: 2
    });
  }

  // Get emails from a specific sender
  async getEmailsFromSender(senderEmail: string): Promise<Message[]> {
    return await graphClientService.makePaginatedRequest<Message>(this.baseEndpoint, {
      filter: `sender/emailAddress/address eq '${senderEmail}'`,
      select: [
        'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink'
      ],
      orderBy: 'receivedDateTime desc',
      top: 100,
      maxPages: 3
    });
  }

  // Get unread emails
  async getUnreadEmails(folderId?: string): Promise<Message[]> {
    const endpoint = folderId 
      ? `/me/mailFolders/${folderId}/messages`
      : this.baseEndpoint;

    return await graphClientService.makePaginatedRequest<Message>(endpoint, {
      filter: 'isRead eq false',
      select: [
        'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink', 'importance'
      ],
      orderBy: 'receivedDateTime desc',
      top: 100,
      maxPages: 3
    });
  }

  // Get flagged emails
  async getFlaggedEmails(): Promise<Message[]> {
    return await graphClientService.makePaginatedRequest<Message>(this.baseEndpoint, {
      filter: 'flag/flagStatus eq \'flagged\'',
      select: [
        'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink'
      ],
      orderBy: 'receivedDateTime desc',
      top: 100,
      maxPages: 3
    });
  }

  // Get high importance emails
  async getHighImportanceEmails(): Promise<Message[]> {
    return await graphClientService.makePaginatedRequest<Message>(this.baseEndpoint, {
      filter: 'importance eq \'high\'',
      select: [
        'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink', 'importance'
      ],
      orderBy: 'receivedDateTime desc',
      top: 50,
      maxPages: 2
    });
  }

  // Mark email as read
  async markAsRead(messageId: string): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${messageId}`, {
      method: 'PATCH',
      body: { isRead: true }
    });
  }

  // Mark email as unread
  async markAsUnread(messageId: string): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${messageId}`, {
      method: 'PATCH',
      body: { isRead: false }
    });
  }

  // Set flag on email
  async setFlag(messageId: string, flagged: boolean): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${messageId}`, {
      method: 'PATCH',
      body: {
        flag: {
          flagStatus: flagged ? 'flagged' : 'notFlagged'
        }
      }
    });
  }

  // Delete email
  async deleteEmail(messageId: string): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${messageId}`, {
      method: 'DELETE'
    });
  }

  // Move email to folder
  async moveEmail(messageId: string, destinationFolderId: string): Promise<Message> {
    return await graphClientService.makeRequest<Message>(`${this.baseEndpoint}/${messageId}/move`, {
      method: 'POST',
      body: { destinationId: destinationFolderId }
    });
  }

  // Get mail folders
  async getMailFolders(): Promise<MailFolder[]> {
    return await graphClientService.makePaginatedRequest<MailFolder>('/me/mailFolders', {
      select: ['id', 'displayName', 'childFolderCount', 'unreadItemCount', 'totalItemCount'],
      orderBy: 'displayName',
      maxPages: 3
    });
  }

  // Send email
  async sendEmail(email: {
    subject: string;
    body: string;
    toRecipients: string[];
    ccRecipients?: string[];
    bccRecipients?: string[];
    importance?: 'low' | 'normal' | 'high';
  }): Promise<void> {
    const message = {
      subject: email.subject,
      body: {
        contentType: 'HTML',
        content: email.body
      },
      toRecipients: email.toRecipients.map(email => ({
        emailAddress: { address: email }
      })),
      ccRecipients: email.ccRecipients?.map(email => ({
        emailAddress: { address: email }
      })) || [],
      bccRecipients: email.bccRecipients?.map(email => ({
        emailAddress: { address: email }
      })) || [],
      importance: email.importance || 'normal'
    };

    await graphClientService.makeRequest('/me/sendMail', {
      method: 'POST',
      body: { message }
    });
  }

  // Reply to email
  async replyToEmail(messageId: string, comment: string): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${messageId}/reply`, {
      method: 'POST',
      body: { comment }
    });
  }

  // Forward email
  async forwardEmail(messageId: string, toRecipients: string[], comment?: string): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${messageId}/forward`, {
      method: 'POST',
      body: {
        comment: comment || '',
        toRecipients: toRecipients.map(email => ({
          emailAddress: { address: email }
        }))
      }
    });
  }

  // Get emails with attachments
  async getEmailsWithAttachments(): Promise<Message[]> {
    return await graphClientService.makePaginatedRequest<Message>(this.baseEndpoint, {
      filter: 'hasAttachments eq true',
      select: [
        'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink'
      ],
      orderBy: 'receivedDateTime desc',
      top: 50,
      maxPages: 2
    });
  }

  // Get recent emails (last 7 days)
  async getRecentEmails(days: number = 7): Promise<Message[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const isoDate = date.toISOString();

    return await graphClientService.makePaginatedRequest<Message>(this.baseEndpoint, {
      filter: `receivedDateTime ge ${isoDate}`,
      select: [
        'id', 'subject', 'bodyPreview', 'sender', 'receivedDateTime',
        'isRead', 'flag', 'hasAttachments', 'webLink'
      ],
      orderBy: 'receivedDateTime desc',
      top: 100,
      maxPages: 3
    });
  }
}

export const mailService = MailService.getInstance(); 