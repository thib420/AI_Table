import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MailboxList } from '@/modules/mailbox/components/MailboxPage/MailboxList'
import { Email } from '@/modules/mailbox/components/MailboxPage/useMailbox'

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Star: ({ className, ...props }: any) => <div data-testid="star-icon" className={className} {...props} />,
  Paperclip: ({ className, ...props }: any) => <div data-testid="paperclip-icon" className={className} {...props} />,
}))

describe('MailboxList', () => {
  const mockEmails: Email[] = [
    {
      id: '1',
      sender: 'John Doe',
      senderEmail: 'john@example.com',
      subject: 'Important Meeting',
      preview: 'Please join us for the quarterly review meeting...',
      timestamp: '2024-01-01T10:00:00Z',
      isRead: false,
      isStarred: true,
      hasAttachments: true,
      folder: 'inbox',
      displayTime: '10:00 AM',
    },
    {
      id: '2',
      sender: 'Jane Smith',
      senderEmail: 'jane@example.com',
      subject: 'Project Update',
      preview: 'Here is the latest update on the project status...',
      timestamp: '2024-01-01T09:00:00Z',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      folder: 'inbox',
      displayTime: '9:00 AM',
    },
    {
      id: '3',
      sender: 'Bob Wilson',
      senderEmail: 'bob@example.com',
      subject: 'Lunch Plans',
      preview: 'Are you free for lunch tomorrow?',
      timestamp: '2024-01-01T08:00:00Z',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      folder: 'inbox',
      displayTime: '8:00 AM',
    },
  ]

  const defaultProps = {
    emails: mockEmails,
    selectedEmailId: null,
    onSelect: jest.fn(),
    onToggleStar: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all emails', () => {
      render(<MailboxList {...defaultProps} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    it('should render email subjects', () => {
      render(<MailboxList {...defaultProps} />)

      expect(screen.getByText('Important Meeting')).toBeInTheDocument()
      expect(screen.getByText('Project Update')).toBeInTheDocument()
      expect(screen.getByText('Lunch Plans')).toBeInTheDocument()
    })

    it('should render email previews', () => {
      render(<MailboxList {...defaultProps} />)

      expect(screen.getByText('Please join us for the quarterly review meeting...')).toBeInTheDocument()
      expect(screen.getByText('Here is the latest update on the project status...')).toBeInTheDocument()
      expect(screen.getByText('Are you free for lunch tomorrow?')).toBeInTheDocument()
    })

    it('should render display times', () => {
      render(<MailboxList {...defaultProps} />)

      expect(screen.getByText('10:00 AM')).toBeInTheDocument()
      expect(screen.getByText('9:00 AM')).toBeInTheDocument()
      expect(screen.getByText('8:00 AM')).toBeInTheDocument()
    })

    it('should show attachment icon for emails with attachments', () => {
      render(<MailboxList {...defaultProps} />)

      const attachmentIcons = screen.getAllByTestId('paperclip-icon')
      expect(attachmentIcons).toHaveLength(1) // Only first email has attachments
    })

    it('should show star icons for all emails', () => {
      render(<MailboxList {...defaultProps} />)

      const starIcons = screen.getAllByTestId('star-icon')
      expect(starIcons).toHaveLength(3) // All emails should have star icons
    })

    it('should render empty state when no emails', () => {
      render(<MailboxList {...defaultProps} emails={[]} />)

      expect(screen.getByText('No emails found')).toBeInTheDocument()
    })
  })

  describe('email selection', () => {
    it('should call onSelect when email is clicked', () => {
      const onSelect = jest.fn()
      render(<MailboxList {...defaultProps} onSelect={onSelect} />)

      const emailRows = screen.getAllByTestId('email-row')
      fireEvent.click(emailRows[0])

      expect(onSelect).toHaveBeenCalledWith(mockEmails[0])
    })

    it('should highlight selected email', () => {
      render(<MailboxList {...defaultProps} selectedEmailId="1" />)

      const emailRows = screen.getAllByTestId('email-row')
      expect(emailRows[0]).toHaveClass('bg-muted')
    })

    it('should not highlight unselected emails', () => {
      render(<MailboxList {...defaultProps} selectedEmailId="1" />)

      const emailRows = screen.getAllByTestId('email-row')
      expect(emailRows[1]).not.toHaveClass('bg-muted')
    })
  })

  describe('unread email styling', () => {
    it('should style unread emails differently', () => {
      render(<MailboxList {...defaultProps} />)

      const emailRows = screen.getAllByTestId('email-row')
      expect(emailRows[0]).toHaveClass('bg-blue-50', 'dark:bg-blue-950/20', 'border-l-2', 'border-l-blue-500')
    })

    it('should not apply unread styling to read emails', () => {
      render(<MailboxList {...defaultProps} />)

      const emailRows = screen.getAllByTestId('email-row')
      expect(emailRows[1]).not.toHaveClass('bg-blue-50')
      expect(emailRows[1]).not.toHaveClass('border-l-2')
    })

    it('should make unread email sender name bold', () => {
      render(<MailboxList {...defaultProps} />)

      const unreadSender = screen.getByText('John Doe')
      expect(unreadSender).toHaveClass('font-semibold')

      const readSender = screen.getByText('Jane Smith')
      expect(readSender).not.toHaveClass('font-semibold')
    })

    it('should make unread email subject bold', () => {
      render(<MailboxList {...defaultProps} />)

      const unreadSubject = screen.getByText('Important Meeting')
      expect(unreadSubject).toHaveClass('font-medium')

      const readSubject = screen.getByText('Project Update')
      expect(readSubject).toHaveClass('text-muted-foreground')
    })
  })

  describe('star functionality', () => {
    it('should call onToggleStar when star is clicked', () => {
      const onToggleStar = jest.fn()
      render(<MailboxList {...defaultProps} onToggleStar={onToggleStar} />)

      const starButtons = screen.getAllByTestId('star-icon')
      fireEvent.click(starButtons[0])

      expect(onToggleStar).toHaveBeenCalledWith(mockEmails[0])
    })

    it('should not call onSelect when star is clicked', () => {
      const onSelect = jest.fn()
      const onToggleStar = jest.fn()
      render(<MailboxList {...defaultProps} onSelect={onSelect} onToggleStar={onToggleStar} />)

      const starButtons = screen.getAllByTestId('star-icon')
      fireEvent.click(starButtons[0])

      expect(onSelect).not.toHaveBeenCalled()
      expect(onToggleStar).toHaveBeenCalled()
    })

    it('should style starred emails differently', () => {
      render(<MailboxList {...defaultProps} />)

      const starIcons = screen.getAllByTestId('star-icon')
      
      // First email is starred
      expect(starIcons[0]).toHaveClass('text-yellow-500', 'fill-current')
      
      // Second email is not starred
      expect(starIcons[1]).toHaveClass('text-muted-foreground')
      expect(starIcons[1]).not.toHaveClass('text-yellow-500')
    })

    it('should work without onToggleStar prop', () => {
      const { onToggleStar, ...propsWithoutToggleStar } = defaultProps
      render(<MailboxList {...propsWithoutToggleStar} />)

      const starButtons = screen.getAllByTestId('star-icon')
      
      // Should not throw error when clicking star
      expect(() => fireEvent.click(starButtons[0])).not.toThrow()
    })
  })

  describe('accessibility', () => {
    it('should have proper button roles for star icons', () => {
      render(<MailboxList {...defaultProps} />)

      const starButtons = screen.getAllByRole('button')
      expect(starButtons.length).toBeGreaterThan(0)
    })

    it('should have clickable email rows', () => {
      render(<MailboxList {...defaultProps} />)

      const emailRows = screen.getAllByTestId('email-row')
      emailRows.forEach(row => {
        expect(row).toHaveClass('cursor-pointer')
      })
    })
  })

  describe('avatar functionality', () => {
    it('should render avatars for all emails', () => {
      render(<MailboxList {...defaultProps} />)

      // Check for avatar components (they should be rendered)
      const avatars = screen.getAllByText('JD') // John Doe initials
      expect(avatars.length).toBeGreaterThan(0)
    })

    it('should generate correct initials for sender names', () => {
      render(<MailboxList {...defaultProps} />)

      expect(screen.getByText('JD')).toBeInTheDocument() // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument() // Jane Smith
      expect(screen.getByText('BW')).toBeInTheDocument() // Bob Wilson
    })
  })

  describe('hover effects', () => {
    it('should have hover effects on email rows', () => {
      render(<MailboxList {...defaultProps} />)

      const emailRows = screen.getAllByTestId('email-row')
      emailRows.forEach(row => {
        expect(row).toHaveClass('hover:bg-muted/50')
      })
    })

    it('should have transition effects', () => {
      render(<MailboxList {...defaultProps} />)

      const emailRows = screen.getAllByTestId('email-row')
      emailRows.forEach(row => {
        expect(row).toHaveClass('transition-colors')
      })
    })
  })
}) 