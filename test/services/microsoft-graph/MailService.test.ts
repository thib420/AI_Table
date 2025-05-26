import { MailService } from '@/shared/services/microsoft-graph/api/MailService'
import { graphClientService } from '@/shared/services/microsoft-graph/core/GraphClientService'
import { Message } from '@microsoft/microsoft-graph-types'

// Mock the GraphClientService
jest.mock('@/shared/services/microsoft-graph/core/GraphClientService')
const mockGraphClientService = graphClientService as jest.Mocked<typeof graphClientService>

describe('MailService', () => {
  let mailService: MailService

  beforeEach(() => {
    jest.clearAllMocks()
    mailService = MailService.getInstance()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MailService.getInstance()
      const instance2 = MailService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('getEmails', () => {
    const mockMessages: Message[] = [
      {
        id: '1',
        subject: 'Test Email 1',
        bodyPreview: 'This is a test email',
        sender: {
          emailAddress: {
            name: 'John Doe',
            address: 'john@example.com',
          },
        },
        receivedDateTime: '2024-01-01T10:00:00Z',
        isRead: false,
        hasAttachments: false,
      },
      {
        id: '2',
        subject: 'Test Email 2',
        bodyPreview: 'Another test email',
        sender: {
          emailAddress: {
            name: 'Jane Smith',
            address: 'jane@example.com',
          },
        },
        receivedDateTime: '2024-01-01T11:00:00Z',
        isRead: true,
        hasAttachments: true,
      },
    ]

    it('should get emails from inbox by default', async () => {
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      const result = await mailService.getEmails()

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/messages',
        expect.objectContaining({
          select: expect.arrayContaining([
            'id',
            'subject',
            'bodyPreview',
            'sender',
            'receivedDateTime',
            'isRead',
            'flag',
            'hasAttachments',
            'webLink',
            'importance',
            'toRecipients',
            'ccRecipients',
          ]),
          orderBy: 'receivedDateTime desc',
          top: 50,
          maxPages: 3,
        })
      )
      expect(result).toEqual(mockMessages)
    })

    it('should get emails from specific folder', async () => {
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.getEmails('sentitems', 25)

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/mailFolders/sentitems/messages',
        expect.objectContaining({
          top: 25,
        })
      )
    })

    it('should handle custom top parameter', async () => {
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.getEmails('inbox', 100)

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/messages',
        expect.objectContaining({
          top: 100,
        })
      )
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockGraphClientService.makePaginatedRequest.mockRejectedValue(error)

      await expect(mailService.getEmails()).rejects.toThrow('API Error')
    })
  })

  describe('getEmail', () => {
    const mockMessage: Message = {
      id: '123',
      subject: 'Test Email',
      body: {
        content: '<p>Full email content</p>',
        contentType: 'html',
      },
      bodyPreview: 'Preview text',
      sender: {
        emailAddress: {
          name: 'John Doe',
          address: 'john@example.com',
        },
      },
      receivedDateTime: '2024-01-01T10:00:00Z',
      isRead: false,
    }

    it('should get a specific email by ID', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(mockMessage)

      const result = await mailService.getEmail('123')

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123',
        expect.objectContaining({
          select: expect.arrayContaining([
            'id',
            'subject',
            'body',
            'bodyPreview',
            'sender',
            'receivedDateTime',
            'isRead',
            'flag',
            'hasAttachments',
            'webLink',
            'importance',
            'toRecipients',
            'ccRecipients',
            'attachments',
          ]),
          expand: ['attachments'],
        })
      )
      expect(result).toEqual(mockMessage)
    })
  })

  describe('searchEmails', () => {
    it('should search emails with correct filter', async () => {
      const mockMessages: Message[] = []
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.searchEmails('test query')

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/messages',
        expect.objectContaining({
          filter: "contains(subject,'test query') or contains(bodyPreview,'test query')",
          orderBy: 'receivedDateTime desc',
          top: 50,
          maxPages: 2,
        })
      )
    })

    it('should search emails in specific folder', async () => {
      const mockMessages: Message[] = []
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.searchEmails('test query', 'sentitems')

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/mailFolders/sentitems/messages',
        expect.objectContaining({
          filter: "contains(subject,'test query') or contains(bodyPreview,'test query')",
        })
      )
    })
  })

  describe('getEmailsFromSender', () => {
    it('should get emails from specific sender', async () => {
      const mockMessages: Message[] = []
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.getEmailsFromSender('john@example.com')

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/messages',
        expect.objectContaining({
          filter: "sender/emailAddress/address eq 'john@example.com'",
          orderBy: 'receivedDateTime desc',
          top: 100,
          maxPages: 3,
        })
      )
    })
  })

  describe('getUnreadEmails', () => {
    it('should get unread emails from inbox', async () => {
      const mockMessages: Message[] = []
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.getUnreadEmails()

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/messages',
        expect.objectContaining({
          filter: 'isRead eq false',
          orderBy: 'receivedDateTime desc',
          top: 100,
          maxPages: 3,
        })
      )
    })

    it('should get unread emails from specific folder', async () => {
      const mockMessages: Message[] = []
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.getUnreadEmails('sentitems')

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/mailFolders/sentitems/messages',
        expect.objectContaining({
          filter: 'isRead eq false',
        })
      )
    })
  })

  describe('getFlaggedEmails', () => {
    it('should get flagged emails', async () => {
      const mockMessages: Message[] = []
      mockGraphClientService.makePaginatedRequest.mockResolvedValue(mockMessages)

      await mailService.getFlaggedEmails()

      expect(mockGraphClientService.makePaginatedRequest).toHaveBeenCalledWith(
        '/me/messages',
        expect.objectContaining({
          filter: "flag/flagStatus eq 'flagged'",
          orderBy: 'receivedDateTime desc',
          top: 100,
          maxPages: 3,
        })
      )
    })
  })

  describe('markAsRead', () => {
    it('should mark email as read', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.markAsRead('123')

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123',
        {
          method: 'PATCH',
          body: { isRead: true },
        }
      )
    })
  })

  describe('markAsUnread', () => {
    it('should mark email as unread', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.markAsUnread('123')

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123',
        {
          method: 'PATCH',
          body: { isRead: false },
        }
      )
    })
  })

  describe('setFlag', () => {
    it('should set flag on email', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.setFlag('123', true)

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123',
        {
          method: 'PATCH',
          body: {
            flag: {
              flagStatus: 'flagged',
            },
          },
        }
      )
    })

    it('should remove flag from email', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.setFlag('123', false)

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123',
        {
          method: 'PATCH',
          body: {
            flag: {
              flagStatus: 'notFlagged',
            },
          },
        }
      )
    })
  })

  describe('deleteEmail', () => {
    it('should delete email', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.deleteEmail('123')

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123',
        {
          method: 'DELETE',
        }
      )
    })
  })

  describe('sendEmail', () => {
    it('should send email with all recipients', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      const emailData = {
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
        toRecipients: ['to@example.com'],
        ccRecipients: ['cc@example.com'],
        bccRecipients: ['bcc@example.com'],
        importance: 'high' as const,
      }

      await mailService.sendEmail(emailData)

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/sendMail',
        {
          method: 'POST',
          body: {
            message: {
              subject: 'Test Subject',
              body: {
                contentType: 'HTML',
                content: '<p>Test Body</p>',
              },
              toRecipients: [{ emailAddress: { address: 'to@example.com' } }],
              ccRecipients: [{ emailAddress: { address: 'cc@example.com' } }],
              bccRecipients: [{ emailAddress: { address: 'bcc@example.com' } }],
              importance: 'high',
            },
          },
        }
      )
    })

    it('should send email with minimal data', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      const emailData = {
        subject: 'Test Subject',
        body: 'Test Body',
        toRecipients: ['to@example.com'],
      }

      await mailService.sendEmail(emailData)

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/sendMail',
        {
          method: 'POST',
          body: {
            message: {
              subject: 'Test Subject',
              body: {
                contentType: 'HTML',
                content: 'Test Body',
              },
              toRecipients: [{ emailAddress: { address: 'to@example.com' } }],
              ccRecipients: [],
              bccRecipients: [],
              importance: 'normal',
            },
          },
        }
      )
    })
  })

  describe('replyToEmail', () => {
    it('should reply to email', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.replyToEmail('123', 'Reply comment')

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123/reply',
        {
          method: 'POST',
          body: { comment: 'Reply comment' },
        }
      )
    })
  })

  describe('forwardEmail', () => {
    it('should forward email', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.forwardEmail('123', ['forward@example.com'], 'Forward comment')

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123/forward',
        {
          method: 'POST',
          body: {
            comment: 'Forward comment',
            toRecipients: [{ emailAddress: { address: 'forward@example.com' } }],
          },
        }
      )
    })

    it('should forward email without comment', async () => {
      mockGraphClientService.makeRequest.mockResolvedValue(undefined)

      await mailService.forwardEmail('123', ['forward@example.com'])

      expect(mockGraphClientService.makeRequest).toHaveBeenCalledWith(
        '/me/messages/123/forward',
        {
          method: 'POST',
          body: {
            comment: '',
            toRecipients: [{ emailAddress: { address: 'forward@example.com' } }],
          },
        }
      )
    })
  })
}) 