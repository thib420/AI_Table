import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MicrosoftAuthProvider } from '@/modules/mailbox/services/MicrosoftAuthContext'
import { Email } from '@/modules/mailbox/components/MailboxPage/useMailbox'

// Test wrapper component
export const MailboxTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MicrosoftAuthProvider>
      {children}
    </MicrosoftAuthProvider>
  )
}

// Helper function to render mailbox components with proper context
export const renderWithMailboxContext = (component: React.ReactElement) => {
  return render(
    <MailboxTestWrapper>
      {component}
    </MailboxTestWrapper>
  )
}

// Helper function to activate demo mode in tests
export const activateDemoMode = async () => {
  const demoButton = await screen.findByText('Continue with Demo Data')
  fireEvent.click(demoButton)
  
  // Wait for demo mode to be active
  await waitFor(() => {
    expect(screen.getByText('Demo Mode')).toBeInTheDocument()
  })
}

// Mock email data for testing
export const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'Sarah Johnson',
    senderEmail: 'sarah.johnson@techcorp.com',
    subject: 'RE: Partnership Proposal Discussion',
    preview: 'Thank you for the detailed proposal. I\'ve reviewed it with our team and we\'re very interested in moving forward...',
    timestamp: '2024-01-20T10:30:00Z',
    isRead: false,
    isStarred: true,
    hasAttachments: true,
    folder: 'inbox',
    displayTime: '10:30 AM',
  },
  {
    id: '2',
    sender: 'Michael Chen',
    senderEmail: 'michael.chen@innovate.io',
    subject: 'Integration Meeting Follow-up',
    preview: 'Great meeting today! As discussed, I\'m attaching the technical specifications for the API integration...',
    timestamp: '2024-01-19T15:45:00Z',
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    folder: 'inbox',
    displayTime: '3:45 PM',
  },
  {
    id: '3',
    sender: 'Emily Rodriguez',
    senderEmail: 'emily.r@globaltech.com',
    subject: 'Demo Request - GlobalTech Solutions',
    preview: 'Hi there, I came across your platform and would love to schedule a demo for our team. We\'re particularly interested in...',
    timestamp: '2024-01-19T09:15:00Z',
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    folder: 'inbox',
    displayTime: '9:15 AM',
  }
]

// Helper function to select an email in tests
export const selectEmail = async (emailIndex: number = 0) => {
  const emailRows = screen.getAllByTestId('email-row')
  fireEvent.click(emailRows[emailIndex])
  
  // Wait for email to be selected
  await waitFor(() => {
    expect(emailRows[emailIndex]).toHaveClass('bg-muted')
  })
}

// Helper function to click star button
export const toggleEmailStar = async (emailIndex: number = 0) => {
  const starButtons = screen.getAllByTestId('star-icon')
  fireEvent.click(starButtons[emailIndex])
}

// Helper function to search emails
export const searchEmails = async (searchTerm: string) => {
  const searchInput = screen.getByPlaceholderText('Search emails...')
  fireEvent.change(searchInput, { target: { value: searchTerm } })
}

// Helper function to switch mailbox view
export const switchMailboxView = async (viewName: string) => {
  const viewButton = screen.getByText(viewName)
  fireEvent.click(viewButton)
  
  // Wait for view to be active
  await waitFor(() => {
    expect(viewButton.closest('button')).toHaveClass('bg-primary')
  })
}

// Helper function to wait for emails to load
export const waitForEmailsToLoad = async () => {
  await waitFor(() => {
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
  })
}

// Helper function to check if mailbox is in demo mode
export const expectDemoMode = () => {
  expect(screen.getByText('Demo Mode')).toBeInTheDocument()
}

// Helper function to check if mailbox is connected
export const expectConnectedMode = () => {
  expect(screen.getByText('Connected')).toBeInTheDocument()
}

// Mock service responses
export const mockMailboxService = {
  getEmails: jest.fn().mockResolvedValue(mockEmails),
  markAsRead: jest.fn().mockResolvedValue(undefined),
  toggleStar: jest.fn().mockResolvedValue(undefined),
  searchEmails: jest.fn().mockResolvedValue(mockEmails.slice(0, 1)),
}

// Helper to mock Microsoft Graph services
export const mockMicrosoftGraphServices = () => {
  jest.mock('@/modules/mailbox/services/microsoft-graph', () => ({
    microsoftGraphService: mockMailboxService
  }))
  
  jest.mock('@/shared/services/microsoft-graph/GraphServiceManager', () => ({
    graphServiceManager: {
      initialize: jest.fn().mockResolvedValue(undefined),
      isInitialized: jest.fn().mockReturnValue(true),
      isAuthenticated: jest.fn().mockReturnValue(false),
      mail: mockMailboxService,
    }
  }))
}

// Performance testing helper
export const measureRenderTime = (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Accessibility testing helper
export const checkAccessibility = async () => {
  // Check for proper ARIA labels
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBeGreaterThan(0)
  
  // Check for proper headings
  const headings = screen.getAllByRole('heading')
  expect(headings.length).toBeGreaterThan(0)
  
  // Check for keyboard navigation
  const firstButton = buttons[0]
  firstButton.focus()
  expect(document.activeElement).toBe(firstButton)
}

// Error simulation helper
export const simulateNetworkError = () => {
  mockMailboxService.getEmails.mockRejectedValueOnce(new Error('Network error'))
}

// Helper to reset all mocks
export const resetAllMocks = () => {
  Object.values(mockMailboxService).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear()
    }
  })
} 