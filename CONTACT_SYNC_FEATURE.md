# Automatic Contact Sync Feature

## Overview

The mailbox now automatically syncs all email contacts (senders and recipients) to your CRM system. This feature extracts contact information from emails and creates CRM entries automatically, helping you build a comprehensive contact database without manual effort.

## Features

### 🔄 Automatic Sync
- **Background Processing**: Contacts are synced automatically when emails are loaded
- **Intelligent Extraction**: Extracts contacts from senders, TO, CC, and BCC recipients
- **Duplicate Prevention**: Checks for existing contacts before creating new ones
- **Smart Filtering**: Excludes system emails (noreply, admin, support, etc.)

### 📧 Contact Information Extraction
- **Name**: Extracted from display name or email address
- **Email**: Primary contact method
- **Company**: Derived from email domain
- **Source Tracking**: Marks contacts as "Mailbox Auto-Sync"
- **Tags**: Automatically tagged with "auto-sync" and "from-mailbox"

### ⚙️ Configurable Settings
- **Auto-sync Toggle**: Enable/disable automatic syncing
- **Batch Processing**: Configure batch size (1-50 contacts)
- **Delay Settings**: Control timing between batches
- **Email Filtering**: 
  - Exclude system emails (noreply, admin, etc.)
  - Exclude specific domains
  - Include only specific prefixes
  - Custom exclude/include rules

### 🎛️ Manual Controls
- **Manual Sync Button**: Trigger sync manually from sidebar
- **Sync Status**: Visual feedback with progress indicators
- **Sync Statistics**: Shows added, existing, and error counts
- **Settings Panel**: Easy access to configuration options

## How It Works

### 1. Email Loading
When emails are loaded (either from Microsoft Graph or mock data):
```typescript
// Automatically triggered in useMailbox.ts
contactSyncService.syncContactsInBackground(combinedEmails)
```

### 2. Contact Extraction
The service extracts unique email addresses from:
- Email senders
- TO recipients
- CC recipients  
- BCC recipients (when available)

### 3. Filtering
Emails are filtered based on settings:
- System email prefixes (noreply, admin, support)
- Excluded domains
- Custom include/exclude rules

### 4. CRM Integration
For each unique email:
- Check if contact already exists in CRM
- If not found, create new contact with:
  - Extracted name from email
  - Company from domain
  - Default status as "lead"
  - Auto-sync tags

### 5. Batch Processing
Contacts are processed in configurable batches with delays to avoid overwhelming the system.

## Usage

### Automatic Sync
1. **Load Mailbox**: Contacts sync automatically when emails load
2. **Background Processing**: Sync happens in the background without blocking UI
3. **Status Updates**: Check console logs for sync progress

### Manual Sync
1. **Click "Sync Contacts"** in the mailbox sidebar
2. **View Progress**: Button shows spinning icon during sync
3. **See Results**: Success message shows sync statistics

### Configure Settings
1. **Click "Sync Settings"** in the mailbox sidebar
2. **Adjust Preferences**:
   - Toggle auto-sync on/off
   - Set batch size and delays
   - Configure email filtering rules
3. **Save Settings**: Settings persist in localStorage

## Settings Options

### Basic Settings
- **Auto Sync**: Enable/disable automatic contact syncing
- **Sync on Startup**: Sync contacts when mailbox loads
- **Exclude System Emails**: Skip noreply, admin, support emails
- **Batch Size**: Number of contacts to process at once (1-50)

### Advanced Filtering
- **Exclude Domains**: Comma-separated list (e.g., "gmail.com, yahoo.com")
- **Exclude Prefixes**: Email prefixes to skip (e.g., "noreply, support")
- **Include Prefixes**: Only sync emails with these prefixes (optional)

## Technical Implementation

### Key Files
- `ContactSyncService.ts`: Core sync logic and contact extraction
- `ContactSyncSettings.ts`: Settings management and filtering rules
- `ContactSyncSettings.tsx`: UI components for settings dialog
- `useMailbox.ts`: Integration with email loading
- `MailboxSidebar.tsx`: Manual sync controls and settings access

### Dependencies
- **CRM Integration**: Uses existing `GraphCRMService` for contact creation
- **Microsoft Graph**: Leverages Graph API for contact information
- **UI Components**: Radix UI components for settings interface

### Error Handling
- **Graceful Failures**: Individual contact sync errors don't stop the process
- **Fallback Contacts**: Creates basic contact info if Graph lookup fails
- **Retry Logic**: Built-in retry mechanisms for API calls
- **User Feedback**: Clear error messages and status indicators

## Benefits

### For Users
- **Effortless Contact Building**: No manual contact entry required
- **Complete Contact Database**: Captures all email interactions
- **Smart Filtering**: Avoids cluttering CRM with system emails
- **Flexible Configuration**: Customize sync behavior to your needs

### For Sales Teams
- **Lead Generation**: Automatic lead capture from email interactions
- **Contact Enrichment**: Builds comprehensive contact profiles
- **Relationship Tracking**: Links contacts to email communications
- **Pipeline Management**: Converts email contacts to CRM opportunities

## Future Enhancements

### Planned Features
- **Contact Enrichment**: Integration with external data sources
- **Duplicate Merging**: Advanced duplicate detection and merging
- **Sync Scheduling**: Scheduled background sync jobs
- **Analytics Dashboard**: Sync statistics and contact insights
- **Custom Field Mapping**: Map email data to custom CRM fields

### Integration Opportunities
- **Calendar Sync**: Sync meeting attendees as contacts
- **Social Media**: Enrich contacts with social profiles
- **Company Data**: Automatic company information lookup
- **Email Tracking**: Link email interactions to contact records

## Troubleshooting

### Common Issues
1. **Sync Not Working**: Check if auto-sync is enabled in settings
2. **Too Many System Emails**: Adjust filtering rules in settings
3. **Slow Performance**: Reduce batch size or increase delays
4. **Missing Contacts**: Check exclude/include rules in settings

### Debug Information
- Check browser console for detailed sync logs
- Look for "ContactSyncService" prefixed messages
- Verify CRM service connectivity
- Test with manual sync button first

## Security & Privacy

### Data Handling
- **Local Processing**: Contact extraction happens locally
- **Secure API Calls**: Uses existing authenticated Graph connections
- **No Data Storage**: No additional data storage beyond CRM
- **User Control**: Full user control over sync behavior

### Permissions
- Uses existing Microsoft Graph permissions
- No additional permissions required
- Respects existing CRM access controls
- Settings stored locally in browser 