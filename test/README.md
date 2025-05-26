# Test Suite Documentation

This directory contains comprehensive tests for the AI Table application, ensuring reliability and maintainability during development.

## Test Structure

```
test/
├── components/          # React component tests
│   └── mailbox/        # Mailbox component tests
├── hooks/              # Custom hook tests
├── services/           # Service layer tests
│   └── microsoft-graph/ # Microsoft Graph API tests
├── integration/        # Integration tests
├── utils/              # Test utilities and helpers
└── README.md          # This file
```

## Test Categories

### 1. Unit Tests

**Location**: `test/services/`, `test/hooks/`

**Purpose**: Test individual functions, classes, and hooks in isolation.

**Examples**:
- `GraphClientService.test.ts` - Tests Microsoft Graph API client
- `MailService.test.ts` - Tests email service functionality
- `useMailbox.test.tsx` - Tests mailbox state management hook

### 2. Component Tests

**Location**: `test/components/`

**Purpose**: Test React components in isolation with mocked dependencies.

**Examples**:
- `MailboxList.test.tsx` - Tests email list component
- Tests component rendering, user interactions, and state changes

### 3. Integration Tests

**Location**: `test/integration/`

**Purpose**: Test complete user workflows and component interactions.

**Examples**:
- `mailbox.integration.test.tsx` - Tests entire mailbox functionality

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Setup**: `jest.setup.js`
- **Environment**: jsdom (for React components)
- **Coverage**: 70% threshold for branches, functions, lines, and statements

### Key Features
- TypeScript support
- Next.js integration
- React Testing Library
- Automatic mocking of external dependencies
- Custom test utilities

## Writing Tests

### Best Practices

1. **Use Descriptive Test Names**
   ```typescript
   it('should mark email as read when selected if unread', async () => {
     // Test implementation
   })
   ```

2. **Follow AAA Pattern**
   ```typescript
   it('should filter emails by search query', async () => {
     // Arrange
     const { result } = renderHook(() => useMailbox())
     
     // Act
     act(() => {
       result.current.setSearchQuery('Partnership')
     })
     
     // Assert
     expect(result.current.emails.length).toBeGreaterThan(0)
   })
   ```

3. **Use Test Utilities**
   ```typescript
   import { render, createMockEmail } from '../utils/testUtils'
   
   const mockEmail = createMockEmail({ isRead: false })
   ```

4. **Mock External Dependencies**
   ```typescript
   jest.mock('@/modules/mailbox/services/microsoft-graph')
   ```

### Component Testing Patterns

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MailboxList } from '@/components/MailboxList'

describe('MailboxList', () => {
  it('should render emails', () => {
    render(<MailboxList emails={mockEmails} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
  
  it('should handle email selection', () => {
    const onSelect = jest.fn()
    render(<MailboxList emails={mockEmails} onSelect={onSelect} />)
    
    fireEvent.click(screen.getByText('John Doe'))
    expect(onSelect).toHaveBeenCalledWith(mockEmails[0])
  })
})
```

### Service Testing Patterns

```typescript
import { MailService } from '@/services/MailService'

describe('MailService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should get emails from inbox', async () => {
    const mailService = MailService.getInstance()
    const result = await mailService.getEmails()
    
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.any(String) })
    ]))
  })
})
```

### Hook Testing Patterns

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMailbox } from '@/hooks/useMailbox'

describe('useMailbox', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useMailbox())
    
    expect(result.current.emails).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })
  
  it('should update search query', () => {
    const { result } = renderHook(() => useMailbox())
    
    act(() => {
      result.current.setSearchQuery('test')
    })
    
    expect(result.current.searchQuery).toBe('test')
  })
})
```

## Test Utilities

### Custom Render Function
```typescript
import { render } from '../utils/testUtils'

// Automatically wraps components with necessary providers
render(<MailboxPage />)
```

### Mock Data Factories
```typescript
import { createMockEmail, createMockGraphMessage } from '../utils/testUtils'

const email = createMockEmail({ isRead: false })
const graphMessage = createMockGraphMessage({ subject: 'Test' })
```

### Common Mocks
```typescript
import { mockMicrosoftGraphService, mockMicrosoftAuth } from '../utils/testUtils'

// Pre-configured mocks for common services
```

## Coverage Requirements

The test suite maintains high coverage standards:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Viewing Coverage
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory and include:
- HTML report (`coverage/lcov-report/index.html`)
- LCOV format for CI integration
- Text summary in terminal

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release builds

### CI Configuration
```bash
npm run test:ci
```

This command:
- Runs all tests once (no watch mode)
- Generates coverage reports
- Fails if coverage thresholds are not met
- Outputs results in CI-friendly format

## Debugging Tests

### Running Specific Tests
```bash
# Run tests in a specific file
npm test MailboxList.test.tsx

# Run tests matching a pattern
npm test --testNamePattern="should render emails"

# Run tests in a specific directory
npm test test/components/
```

### Debug Mode
```bash
# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage

# Run in watch mode with coverage
npm run test:watch -- --coverage
```

### Common Issues

1. **Mock not working**: Ensure mocks are defined before imports
2. **Async tests failing**: Use `waitFor` or `act` for async operations
3. **Component not rendering**: Check if all required props are provided
4. **Environment variables**: Ensure test environment variables are set in `jest.setup.js`

## Adding New Tests

### For New Components
1. Create test file: `test/components/[module]/[Component].test.tsx`
2. Import component and testing utilities
3. Write tests for rendering, interactions, and edge cases
4. Ensure accessibility testing

### For New Services
1. Create test file: `test/services/[Service].test.ts`
2. Mock external dependencies
3. Test all public methods
4. Test error handling

### For New Hooks
1. Create test file: `test/hooks/[hookName].test.tsx`
2. Use `renderHook` from React Testing Library
3. Test state changes and side effects
4. Test cleanup and unmounting

## Performance Testing

### Render Performance
```typescript
import { measureRenderTime } from '../utils/testUtils'

it('should render quickly', async () => {
  const renderTime = await measureRenderTime(() => {
    render(<MailboxPage />)
  })
  
  expect(renderTime).toBeLessThan(100) // 100ms threshold
})
```

### Memory Leaks
- Tests automatically check for memory leaks
- Components are properly unmounted after each test
- Event listeners and subscriptions are cleaned up

## Accessibility Testing

### Basic Checks
```typescript
import { checkAccessibility } from '../utils/testUtils'

it('should be accessible', async () => {
  const { container } = render(<MailboxList />)
  const accessibility = await checkAccessibility(container)
  
  expect(accessibility.buttonCount).toBeGreaterThan(0)
})
```

### Manual Testing
- Use screen readers to test components
- Test keyboard navigation
- Verify color contrast and focus indicators

## Maintenance

### Regular Tasks
1. **Update snapshots**: `npm test -- --updateSnapshot`
2. **Review coverage**: Check for untested code paths
3. **Update mocks**: Keep mocks in sync with real implementations
4. **Refactor tests**: Remove duplicated test code

### Dependencies
- **@testing-library/react**: Component testing
- **@testing-library/jest-dom**: Custom matchers
- **@testing-library/user-event**: User interaction simulation
- **jest**: Test runner and framework
- **jest-environment-jsdom**: Browser-like environment

## Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing](https://web.dev/accessibility-testing/) 