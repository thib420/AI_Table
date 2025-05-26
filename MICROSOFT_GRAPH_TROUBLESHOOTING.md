# Microsoft Graph API Troubleshooting Guide

## Common Issues and Solutions

### 1. "Resource not found for the segment 'v1.0'" Error

**Problem**: When connecting to Microsoft Graph, you get an error like:
```
Failed to load emails from Microsoft: Resource not found for the segment 'v1.0'
```

**Root Cause**: The Microsoft Graph client was receiving endpoints with double version prefixes (e.g., `/v1.0/v1.0/me/messages` instead of `/v1.0/me/messages`).

**Solution**: ✅ **FIXED** - The `GraphClientService` has been updated to:
1. Remove automatic version prefix addition to endpoints
2. Include the version in the base URL during client initialization
3. Normalize endpoints properly without duplicating the version

**Technical Details**:
- **Before**: `Client.init({ baseUrl: 'https://graph.microsoft.com' })` + adding `/v1.0` to each endpoint
- **After**: `Client.init({ baseUrl: 'https://graph.microsoft.com/v1.0' })` + using endpoints as-is

### 2. Authentication Issues

**Problem**: "Not authenticated" or "Authentication failed" errors.

**Possible Causes**:
- Missing or incorrect `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`
- Azure app registration not configured properly
- Insufficient permissions

**Solutions**:
1. Check environment variables:
   ```bash
   # .env.local
   NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_actual_client_id
   ```

2. Verify Azure app registration:
   - Redirect URIs include: `http://localhost:3000/auth/callback`
   - API permissions include: `User.Read`, `Mail.Read`, `Contacts.Read`, etc.

### 3. Permission Errors

**Problem**: "Forbidden" or "InsufficientPermissions" errors.

**Solution**: Ensure your Azure app registration has the required permissions:
- `User.Read` - Basic user profile
- `Mail.Read` - Read emails
- `Mail.ReadWrite` - Read and modify emails  
- `Contacts.Read` - Read contacts
- `People.Read` - Read people data

## Debug Tools

### 1. Built-in Debugger

Use the built-in Graph API debugger to test your connection:

```typescript
import { debugGraphAPI } from '@/shared/services/microsoft-graph/debug/graphDebugger';

// Run in browser console or component
await debugGraphAPI();
```

This will test:
- Service manager initialization
- Authentication status
- User endpoint (`/me`)
- Mail endpoint (`/me/messages`)
- Endpoint construction

### 2. Health Check

```typescript
import { graphServiceManager } from '@/shared/services/microsoft-graph/GraphServiceManager';

const health = await graphServiceManager.healthCheck();
console.log(health);
```

### 3. Manual Testing

Test individual services:

```typescript
// Test authentication
const isAuth = graphServiceManager.isAuthenticated();

// Test user endpoint
const user = await graphServiceManager.getCurrentUser();

// Test mail endpoint
const emails = await graphServiceManager.mail.getEmails('inbox', 5);
```

## Best Practices

### 1. Error Handling

Always wrap Graph API calls in try-catch blocks:

```typescript
try {
  const emails = await graphServiceManager.mail.getEmails();
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // Handle authentication issues
  } else if (error.message.includes('Forbidden')) {
    // Handle permission issues
  } else {
    // Handle other errors
  }
}
```

### 2. Offline Fallback

The mailbox implementation automatically falls back to demo data when Graph API calls fail:

```typescript
try {
  // Try to load real emails
  const realEmails = await loadMicrosoftEmails();
} catch (error) {
  console.error('Graph API failed, using demo data:', error);
  // Fall back to mock data
  const demoEmails = loadDemoEmails();
}
```

### 3. Testing

Use the comprehensive test suite to verify functionality:

```bash
# Test mailbox components
npm test -- --testPathPattern="mailbox|Mailbox"

# Test specific component
npm test -- --testPathPattern=MailboxList.test.tsx
```

## Environment Setup

### Required Environment Variables

```bash
# .env.local
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_microsoft_client_id
```

### Optional Environment Variables

```bash
# For production deployments
MICROSOFT_CLIENT_SECRET=your_client_secret

# For custom Graph API endpoints
NEXT_PUBLIC_GRAPH_API_BASE_URL=https://graph.microsoft.com
NEXT_PUBLIC_GRAPH_API_VERSION=v1.0
```

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for detailed error messages
2. Run the debug tools to identify the specific problem
3. Verify your Azure app registration configuration
4. Ensure all required permissions are granted

## Changelog

- **2024-01-20**: Fixed "Resource not found for the segment 'v1.0'" error
- **2024-01-20**: Added comprehensive error handling and debugging tools
- **2024-01-20**: Enhanced test coverage for mailbox functionality 