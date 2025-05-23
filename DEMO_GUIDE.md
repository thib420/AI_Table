# Microsoft Graph Integration - Demo Guide

## Quick Demo (No Setup Required)

The mailbox works immediately in **demo mode** with sample emails:

1. Start the app: `npm run dev`
2. Navigate to the **Mailbox** section
3. You'll see sample emails with full functionality:
   - Email reading and content viewing
   - Star/unstar functionality
   - Folder navigation (Inbox, Starred, Sent, etc.)
   - Email search
   - Customer 360 integration

## Full Microsoft Integration (5-minute setup)

### Prerequisites
- Microsoft account (Outlook.com, Office 365, or personal Microsoft account)
- Azure account (free tier works)

### Setup Steps

1. **Azure App Registration**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to **Azure Active Directory** → **App registrations**
   - Click **"New registration"**
   - Name: "AI Table Mailbox Demo"
   - Account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: "Single-page application" → `http://localhost:3000`

2. **Configure Permissions**:
   - Go to **API permissions** → **Add a permission**
   - Select **Microsoft Graph** → **Delegated permissions**
   - Add: `User.Read`, `Mail.Read`, `Mail.ReadWrite`
   - Click **Grant admin consent**

3. **Environment Setup**:
   ```bash
   # Create .env.local in project root
   echo "NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_client_id_here" > .env.local
   
   # Restart dev server
   npm run dev
   ```

### Testing the Integration

1. **Connect Your Account**:
   - Open the mailbox interface
   - Click **"Connect Microsoft Account"**
   - Sign in with your Microsoft credentials
   - Grant the requested permissions

2. **Verify Real Email Access**:
   - Your actual emails should now appear
   - Connection status shows "Connected" with your name
   - Real email metadata (sender, subject, timestamp)

3. **Test Core Features**:
   - **Read emails**: Click any email to view content
   - **Star emails**: Click star icon to mark important emails
   - **Folder navigation**: Switch between Inbox, Sent, Starred, etc.
   - **Search**: Search your actual email content
   - **Real-time sync**: Changes reflect in your actual Outlook

4. **Advanced Features**:
   - **Customer 360**: Click "View Customer 360" from any email
   - **Email integration**: See how emails link to customer profiles
   - **Refresh**: Use refresh button to sync latest emails

## Demo Scenarios

### Scenario 1: Business Email Management
- Connect your work email account
- Show real business emails in the interface
- Demonstrate star functionality for important emails
- Show Customer 360 integration with business contacts

### Scenario 2: Personal Email Organization
- Connect personal Outlook account
- Show folder organization (Inbox, Sent, etc.)
- Demonstrate email search functionality
- Show responsive design on mobile

### Scenario 3: Offline/Demo Mode
- Disconnect Microsoft account or use without setup
- Show how app gracefully falls back to demo data
- All features work identically with sample emails
- Perfect for demonstrations without real data

## Troubleshooting

### Common Issues:

**"Client ID not found"**
- Solution: Check `.env.local` file exists in project root
- Restart dev server after adding environment variable

**"AADSTS50011: Invalid redirect URI"**  
- Solution: Ensure Azure redirect URI exactly matches `http://localhost:3000`
- Must be configured as "Single-page application" type

**"Insufficient privileges"**
- Solution: Grant admin consent for permissions in Azure
- Required: User.Read, Mail.Read, Mail.ReadWrite

**"Authentication popup blocked"**
- Solution: Allow popups for localhost in browser settings
- Try using incognito/private mode

### Fallback Behavior
- App automatically detects connection failures
- Falls back to demo mode with sample emails
- All features remain functional
- Error messages guide users to solutions

## Technical Implementation Highlights

### Security
- OAuth2 authentication flow
- No passwords or secrets stored
- Client-side only authentication
- Permissions can be revoked in Microsoft account settings

### Performance
- Efficient Microsoft Graph API usage
- Real-time email synchronization
- Responsive UI with loading states
- Graceful error handling

### Integration
- Seamless Customer 360 connectivity
- Email-to-contact linking
- Cross-module data sharing
- Unified user experience

This integration demonstrates enterprise-ready email management with secure Microsoft authentication and real-time data synchronization. 