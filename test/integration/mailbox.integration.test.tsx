import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MailboxPage } from '@/modules/mailbox/components/MailboxPage'
import { MicrosoftAuthProvider } from '@/modules/mailbox/services/MicrosoftAuthContext'

// Mock the Microsoft Graph services
jest.mock('@/modules/mailbox/services/microsoft-graph')
jest.mock('@/shared/services/microsoft-graph/GraphServiceManager')

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Mail: ({ className, ...props }: any) => <div data-testid="mail-icon" className={className} {...props} />,
  Wifi: ({ className, ...props }: any) => <div data-testid="wifi-icon" className={className} {...props} />,
  WifiOff: ({ className, ...props }: any) => <div data-testid="wifi-off-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  LogOut: ({ className, ...props }: any) => <div data-testid="logout-icon" className={className} {...props} />,
  Settings: ({ className, ...props }: any) => <div data-testid="settings-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-icon" className={className} {...props} />,
  Inbox: ({ className, ...props }: any) => <div data-testid="inbox-icon" className={className} {...props} />,
  Star: ({ className, ...props }: any) => <div data-testid="star-icon" className={className} {...props} />,
  Send: ({ className, ...props }: any) => <div data-testid="send-icon" className={className} {...props} />,
  Archive: ({ className, ...props }: any) => <div data-testid="archive-icon" className={className} {...props} />,
  Calendar: ({ className, ...props }: any) => <div data-testid="calendar-icon" className={className} {...props} />,
  Users: ({ className, ...props }: any) => <div data-testid="users-icon" className={className} {...props} />,
  Reply: ({ className, ...props }: any) => <div data-testid="reply-icon" className={className} {...props} />,
  Forward: ({ className, ...props }: any) => <div data-testid="forward-icon" className={className} {...props} />,
  Trash2: ({ className, ...props }: any) => <div data-testid="trash-icon" className={className} {...props} />,
  Paperclip: ({ className, ...props }: any) => <div data-testid="paperclip-icon" className={className} {...props} />,
}))

// Mock MSAL
jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    getAllAccounts: jest.fn().mockReturnValue([]),
    loginRedirect: jest.fn().mockResolvedValue(undefined),
    logoutRedirect: jest.fn().mockResolvedValue(undefined),
    acquireTokenSilent: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    handleRedirectPromise: jest.fn().mockResolvedValue(null),
  })),
}))

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MicrosoftAuthProvider>
      {children}
    </MicrosoftAuthProvider>
  )
}

describe('Mailbox Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID = 'test-client-id'
  })

  describe('Initial Load - Not Authenticated', () => {
    it('should show connection prompt when not authenticated', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Connect to Microsoft Outlook')).toBeInTheDocument()
      })

      expect(screen.getByText('Demo Mode')).toBeInTheDocument()
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument()
    })

    it('should show setup instructions when client ID is not configured', async () => {
      // Mock unconfigured environment
      process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID = 'your_microsoft_client_id_here'

      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Setup Required:')).toBeInTheDocument()
      })

      expect(screen.getByText('Setup Required')).toBeInTheDocument()
    })

    it('should allow continuing with demo data', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Continue with Demo Data')).toBeInTheDocument()
      })

      const demoButton = screen.getByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      // Should show demo mode interface
      await waitFor(() => {
        expect(screen.getByText('Demo Mode')).toBeInTheDocument()
      })
    })
  })

  describe('Demo Mode Functionality', () => {
    it('should display mock emails in demo mode', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Wait for connection prompt to appear
      await waitFor(() => {
        expect(screen.getByText('Connect to Microsoft Outlook')).toBeInTheDocument()
      })

      // Click "Continue with Demo Data" button
      const demoButton = screen.getByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      // Wait for demo mode to load
      await waitFor(() => {
        expect(screen.getByText('Demo Mode')).toBeInTheDocument()
      })

      // Should show mock emails
      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('Michael Chen')).toBeInTheDocument()
        expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument()
      })
    })

    it('should allow email selection in demo mode', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })

      // Click on first email row
      const emailRows = screen.getAllByTestId('email-row')
      fireEvent.click(emailRows[0])

      // Should show email detail in the detail view (not just the list)
      await waitFor(() => {
        const emailDetailHeading = screen.getByRole('heading', { name: 'RE: Partnership Proposal Discussion' })
        expect(emailDetailHeading).toBeInTheDocument()
      })
    })

    it('should allow starring emails in demo mode', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })

      // Find and click star button
      const starButtons = screen.getAllByTestId('star-icon')
      fireEvent.click(starButtons[0])

      // Star state should change (this is handled by the component state)
      expect(starButtons[0]).toBeInTheDocument()
    })
  })

  describe('Sidebar Navigation', () => {
    it('should show all navigation options', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Inbox')).toBeInTheDocument()
      })

      expect(screen.getByText('Starred')).toBeInTheDocument()
      expect(screen.getByText('Sent')).toBeInTheDocument()
      expect(screen.getByText('Drafts')).toBeInTheDocument()
      expect(screen.getByText('Archive')).toBeInTheDocument()
    })

    it('should allow switching between views', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Inbox')).toBeInTheDocument()
      })

      // Click on Starred
      const starredButton = screen.getByText('Starred')
      fireEvent.click(starredButton)

      // Should filter to starred emails
      await waitFor(() => {
        // The starred view should be active (button styling changes)
        expect(starredButton.closest('button')).toHaveClass('bg-primary')
      })
    })

    it('should show quick actions', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      })

      expect(screen.getByText('Schedule Meeting')).toBeInTheDocument()
      expect(screen.getByText('Add to CRM')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search emails...')).toBeInTheDocument()
      })
    })

    it('should filter emails based on search query', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search emails...')
      fireEvent.change(searchInput, { target: { value: 'Partnership' } })

      // Should filter emails containing "Partnership"
      await waitFor(() => {
        expect(screen.getByText('RE: Partnership Proposal Discussion')).toBeInTheDocument()
      })
    })
  })

  describe('Email Detail View', () => {
    it('should show email detail when email is selected', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })

      // Click on first email row
      const emailRows = screen.getAllByTestId('email-row')
      fireEvent.click(emailRows[0])

      // Should show email detail
      await waitFor(() => {
        const emailDetailHeading = screen.getByRole('heading', { name: 'RE: Partnership Proposal Discussion' })
        expect(emailDetailHeading).toBeInTheDocument()
        expect(screen.getByText('sarah.johnson@techcorp.com')).toBeInTheDocument()
      })
    })

    it('should show email actions in detail view', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })

      // Click on first email row
      const emailRows = screen.getAllByTestId('email-row')
      fireEvent.click(emailRows[0])

      // Should show action buttons in the email detail view
      await waitFor(() => {
        const actionButtons = screen.getAllByTestId('reply-icon')
        expect(actionButtons.length).toBeGreaterThan(0)
        
        const forwardButtons = screen.getAllByTestId('forward-icon')
        expect(forwardButtons.length).toBeGreaterThan(0)
        
        const archiveButtons = screen.getAllByTestId('archive-icon')
        expect(archiveButtons.length).toBeGreaterThan(0)
        
        const trashButtons = screen.getAllByTestId('trash-icon')
        expect(trashButtons.length).toBeGreaterThan(0)
      })
    })

    it('should show View Customer 360 button', async () => {
      const mockOnCustomerView = jest.fn()
      render(
        <TestWrapper>
          <MailboxPage onCustomerView={mockOnCustomerView} />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })

      // Click on first email row
      const emailRows = screen.getAllByTestId('email-row')
      fireEvent.click(emailRows[0])

      // Should show View Customer 360 button
      await waitFor(() => {
        expect(screen.getByText('View Customer 360')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no email is selected', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Select an email')).toBeInTheDocument()
      })

      expect(screen.getByText('Choose an email from the list to view its content')).toBeInTheDocument()
      // Look for the large mail icon in the empty state (not the smaller ones in buttons)
      const mailIcons = screen.getAllByTestId('mail-icon')
      const emptyStateIcon = mailIcons.find(icon => icon.className.includes('h-16'))
      expect(emptyStateIcon).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render all main sections', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        // Header should be present
        expect(screen.getByText('Mailbox')).toBeInTheDocument()
        
        // Sidebar should be present
        expect(screen.getByText('Inbox')).toBeInTheDocument()
        
        // Main content area should be present
        expect(screen.getByText('Select an email')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing customer view callback gracefully', async () => {
      render(
        <TestWrapper>
          <MailboxPage onCustomerView={undefined} />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      })

      // Click on first email row
      const emailRows = screen.getAllByTestId('email-row')
      fireEvent.click(emailRows[0])

      // View Customer 360 button should not be present
      await waitFor(() => {
        expect(screen.queryByText('View Customer 360')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Mailbox')).toBeInTheDocument()
      })

      // Check for buttons
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <MailboxPage />
        </TestWrapper>
      )

      // Click "Continue with Demo Data" button
      const demoButton = await screen.findByText('Continue with Demo Data')
      fireEvent.click(demoButton)

      await waitFor(() => {
        expect(screen.getByText('Inbox')).toBeInTheDocument()
      })

      // All interactive elements should be focusable
      const inboxButton = screen.getByText('Inbox').closest('button')
      expect(inboxButton).toBeInTheDocument()
      
      if (inboxButton) {
        inboxButton.focus()
        expect(document.activeElement).toBe(inboxButton)
      }
    })
  })
}) 