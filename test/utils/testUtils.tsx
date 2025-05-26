import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MicrosoftAuthProvider } from '@/modules/mailbox/services/MicrosoftAuthContext'

// Mock providers for testing
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MicrosoftAuthProvider>
      {children}
    </MicrosoftAuthProvider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data factories
export const createMockEmail = (overrides = {}) => ({
  id: '1',
  sender: 'John Doe',
  senderEmail: 'john@example.com',
  subject: 'Test Email',
  preview: 'This is a test email preview',
  timestamp: '2024-01-01T10:00:00Z',
  isRead: false,
  isStarred: false,
  hasAttachments: false,
  folder: 'inbox' as const,
  displayTime: '10:00 AM',
  avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe',
  ...overrides,
})

export const createMockGraphMessage = (overrides = {}) => ({
  id: '1',
  subject: 'Test Email',
  bodyPreview: 'This is a test email preview',
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
  ...overrides,
})

export const createMockUserProfile = (overrides = {}) => ({
  displayName: 'Test User',
  mail: 'test@example.com',
  userPrincipalName: 'test@example.com',
  ...overrides,
})

// Mock implementations for common services
export const mockMicrosoftGraphService = {
  getEmails: jest.fn().mockResolvedValue([]),
  markAsRead: jest.fn().mockResolvedValue(undefined),
  setFlag: jest.fn().mockResolvedValue(undefined),
  getUserProfile: jest.fn().mockResolvedValue(createMockUserProfile()),
  initialize: jest.fn().mockResolvedValue(undefined),
  signIn: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockResolvedValue(undefined),
  isSignedIn: jest.fn().mockReturnValue(false),
  getCurrentAccount: jest.fn().mockReturnValue(null),
}

export const mockMicrosoftAuth = {
  isSignedIn: false,
  isLoading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  userProfile: null,
  account: null,
}

// Helper functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const mockEnvironmentVariables = (vars: Record<string, string>) => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars }
  })
  afterEach(() => {
    process.env = originalEnv
  })
}

// Custom matchers for better assertions
export const expectEmailToBeDisplayed = (email: ReturnType<typeof createMockEmail>) => {
  const { getByText } = require('@testing-library/react')
  expect(getByText(email.sender)).toBeInTheDocument()
  expect(getByText(email.subject)).toBeInTheDocument()
  expect(getByText(email.preview)).toBeInTheDocument()
}

// Mock data sets
export const mockEmailList = [
  createMockEmail({
    id: '1',
    sender: 'Sarah Johnson',
    senderEmail: 'sarah.johnson@techcorp.com',
    subject: 'RE: Partnership Proposal Discussion',
    preview: 'Thank you for the detailed proposal. I\'ve reviewed it with our team...',
    isStarred: true,
    hasAttachments: true,
  }),
  createMockEmail({
    id: '2',
    sender: 'Michael Chen',
    senderEmail: 'michael.chen@innovate.io',
    subject: 'Integration Meeting Follow-up',
    preview: 'Great meeting today! As discussed, I\'m attaching the technical specifications...',
    isRead: true,
  }),
  createMockEmail({
    id: '3',
    sender: 'Emily Rodriguez',
    senderEmail: 'emily.r@globaltech.com',
    subject: 'Demo Request - GlobalTech Solutions',
    preview: 'Hi there, I came across your platform and would love to schedule a demo...',
    isRead: true,
  }),
]

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Accessibility testing helpers
export const checkAccessibility = async (container: HTMLElement) => {
  // Basic accessibility checks
  const buttons = container.querySelectorAll('button')
  const inputs = container.querySelectorAll('input')
  const links = container.querySelectorAll('a')

  // Check that interactive elements are focusable
  buttons.forEach(button => {
    expect(button.tabIndex).not.toBe(-1)
  })

  inputs.forEach(input => {
    expect(input.tabIndex).not.toBe(-1)
  })

  links.forEach(link => {
    expect(link.tabIndex).not.toBe(-1)
  })

  return {
    buttonCount: buttons.length,
    inputCount: inputs.length,
    linkCount: links.length,
  }
} 