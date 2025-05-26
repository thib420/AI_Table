import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useMailbox } from '@/modules/mailbox/components/MailboxPage/useMailbox'
import { useMicrosoftAuth } from '@/modules/mailbox/services/MicrosoftAuthContext'
import { microsoftGraphService } from '@/modules/mailbox/services/microsoft-graph'

// Mock the dependencies
jest.mock('@/modules/mailbox/services/MicrosoftAuthContext')
jest.mock('@/modules/mailbox/services/microsoft-graph')

const mockUseMicrosoftAuth = useMicrosoftAuth as jest.MockedFunction<typeof useMicrosoftAuth>
const mockMicrosoftGraphService = microsoftGraphService as jest.Mocked<typeof microsoftGraphService>

describe('useMailbox', () => {
  const mockMessages = [
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
      flag: { flagStatus: 'notFlagged' },
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
      receivedDateTime: '2024-01-01T09:00:00Z',
      isRead: true,
      flag: { flagStatus: 'flagged' },
      hasAttachments: true,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockUseMicrosoftAuth.mockReturnValue({
      isSignedIn: false,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      userProfile: null,
      account: null,
    })

    mockMicrosoftGraphService.getEmails = jest.fn().mockResolvedValue(mockMessages)
    mockMicrosoftGraphService.markAsRead = jest.fn().mockResolvedValue(undefined)
    mockMicrosoftGraphService.setFlag = jest.fn().mockResolvedValue(undefined)
  })

  describe('initialization', () => {
    it('should initialize with mock data when not signed in', async () => {
      const { result } = renderHook(() => useMailbox())

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.emails).toHaveLength(3) // Mock emails
      expect(result.current.isConnected).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should load Microsoft emails when signed in', async () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: true,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: { displayName: 'Test User' },
        account: { homeAccountId: 'test' } as any,
      })

      const { result } = renderHook(() => useMailbox())

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockMicrosoftGraphService.getEmails).toHaveBeenCalledWith('inbox', 50)
      expect(mockMicrosoftGraphService.getEmails).toHaveBeenCalledWith('sentitems', 20)
      expect(result.current.isConnected).toBe(true)
    })

    it('should handle loading state during auth', () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: false,
        isLoading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: null,
        account: null,
      })

      const { result } = renderHook(() => useMailbox())

      expect(result.current.isLoading).toBe(false) // Hook manages its own loading state
    })
  })

  describe('email filtering', () => {
    it('should filter emails by view', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Default view is inbox
      expect(result.current.emails.every(email => email.folder === 'inbox')).toBe(true)

      // Change to starred view
      act(() => {
        result.current.setCurrentView('starred')
      })

      expect(result.current.emails.every(email => email.isStarred)).toBe(true)
    })

    it('should filter emails by search query', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Set search query
      act(() => {
        result.current.setSearchQuery('Partnership')
      })

      const filteredEmails = result.current.emails
      expect(filteredEmails.length).toBeGreaterThan(0)
      expect(filteredEmails.every(email => 
        email.sender.toLowerCase().includes('partnership') ||
        email.subject.toLowerCase().includes('partnership') ||
        email.preview.toLowerCase().includes('partnership')
      )).toBe(true)
    })

    it('should combine view and search filters', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Set starred view and search
      act(() => {
        result.current.setCurrentView('starred')
        result.current.setSearchQuery('test')
      })

      const filteredEmails = result.current.emails
      expect(filteredEmails.every(email => email.isStarred)).toBe(true)
    })
  })

  describe('email selection', () => {
    it('should select email', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const firstEmail = result.current.emails[0]
      
      act(() => {
        result.current.setSelectedEmail(firstEmail)
      })

      expect(result.current.selectedEmail).toBe(firstEmail)
    })

    it('should mark email as read when selected if unread', async () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: true,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: { displayName: 'Test User' },
        account: { homeAccountId: 'test' } as any,
      })

      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Find an unread email
      const unreadEmail = result.current.allEmails.find(email => !email.isRead)
      
      if (unreadEmail) {
        act(() => {
          result.current.setSelectedEmail(unreadEmail)
        })

        // Wait for markAsRead to be called
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(mockMicrosoftGraphService.markAsRead).toHaveBeenCalled()
      }
    })
  })

  describe('star functionality', () => {
    it('should toggle star when signed in', async () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: true,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: { displayName: 'Test User' },
        account: { homeAccountId: 'test' } as any,
      })

      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const email = result.current.allEmails[0]
      const originalStarred = email.isStarred

      await act(async () => {
        await result.current.toggleStar(email)
      })

      expect(mockMicrosoftGraphService.setFlag).toHaveBeenCalledWith(
        email.graphMessage?.id,
        !originalStarred
      )
    })

    it('should not call API when not signed in', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const email = result.current.allEmails[0]

      await act(async () => {
        await result.current.toggleStar(email)
      })

      expect(mockMicrosoftGraphService.setFlag).not.toHaveBeenCalled()
    })
  })

  describe('refresh functionality', () => {
    it('should refresh emails when signed in', async () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: true,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: { displayName: 'Test User' },
        account: { homeAccountId: 'test' } as any,
      })

      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Clear previous calls
      jest.clearAllMocks()

      await act(async () => {
        await result.current.refreshEmails()
      })

      expect(mockMicrosoftGraphService.getEmails).toHaveBeenCalled()
    })

    it('should not refresh when not signed in', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Clear previous calls
      jest.clearAllMocks()

      await act(async () => {
        await result.current.refreshEmails()
      })

      expect(mockMicrosoftGraphService.getEmails).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: true,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: { displayName: 'Test User' },
        account: { homeAccountId: 'test' } as any,
      })

      const error = new Error('API Error')
      mockMicrosoftGraphService.getEmails.mockRejectedValue(error)

      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.error).toContain('Failed to load emails from Microsoft')
      expect(result.current.allEmails).toHaveLength(3) // Should fallback to mock data
    })

    it('should handle mark as read errors', async () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: true,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: { displayName: 'Test User' },
        account: { homeAccountId: 'test' } as any,
      })

      mockMicrosoftGraphService.markAsRead.mockRejectedValue(new Error('Mark as read failed'))

      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const unreadEmail = result.current.allEmails.find(email => !email.isRead)
      
      if (unreadEmail) {
        // Should not throw error
        await act(async () => {
          await result.current.markAsRead(unreadEmail)
        })
      }
    })
  })

  describe('view management', () => {
    it('should change current view', async () => {
      const { result } = renderHook(() => useMailbox())

      expect(result.current.currentView).toBe('inbox')

      act(() => {
        result.current.setCurrentView('sent')
      })

      expect(result.current.currentView).toBe('sent')
    })

    it('should update search query', async () => {
      const { result } = renderHook(() => useMailbox())

      expect(result.current.searchQuery).toBe('')

      act(() => {
        result.current.setSearchQuery('test query')
      })

      expect(result.current.searchQuery).toBe('test query')
    })
  })

  describe('data transformation', () => {
    it('should transform Graph messages to Email objects', async () => {
      mockUseMicrosoftAuth.mockReturnValue({
        isSignedIn: true,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        userProfile: { displayName: 'Test User' },
        account: { homeAccountId: 'test' } as any,
      })

      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const emails = result.current.allEmails
      expect(emails.length).toBeGreaterThan(0)

      emails.forEach(email => {
        expect(email).toHaveProperty('id')
        expect(email).toHaveProperty('sender')
        expect(email).toHaveProperty('senderEmail')
        expect(email).toHaveProperty('subject')
        expect(email).toHaveProperty('preview')
        expect(email).toHaveProperty('timestamp')
        expect(email).toHaveProperty('isRead')
        expect(email).toHaveProperty('isStarred')
        expect(email).toHaveProperty('hasAttachments')
        expect(email).toHaveProperty('folder')
        expect(email).toHaveProperty('displayTime')
        expect(email).toHaveProperty('avatarUrl')
      })
    })

    it('should generate avatar URLs', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const emails = result.current.allEmails
      emails.forEach(email => {
        expect(email.avatarUrl).toContain('ui-avatars.com')
        expect(email.avatarUrl).toContain(encodeURIComponent(email.sender))
      })
    })

    it('should format timestamps correctly', async () => {
      const { result } = renderHook(() => useMailbox())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const emails = result.current.allEmails
      emails.forEach(email => {
        expect(email.displayTime).toBeDefined()
        expect(typeof email.displayTime).toBe('string')
      })
    })
  })
}) 