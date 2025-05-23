# Microsoft Graph Integration Setup

## Overview
This guide explains how to set up Microsoft Graph integration to connect the mailbox to real Microsoft/Outlook emails.

## Prerequisites
- Azure account (free accounts work)
- Microsoft 365 or Outlook.com email account

## Step 1: Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **"New registration"**
4. Fill in the details:
   - **Name**: "AI Table Mailbox" (or your preferred name)
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Type: "Single-page application (SPA)"
     - URI: `http://localhost:3000` (for development) or your production domain

## Step 2: Configure API Permissions

1. In your app registration, go to **"API permissions"**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"**
5. Add these permissions:
   - `User.Read` (to read user profile)
   - `Mail.Read` (to read emails)
   - `Mail.ReadWrite` (to mark as read, star emails)
6. Click **"Grant admin consent"** if you have admin rights, or ask your admin

## Step 3: Get Client ID

1. In your app registration overview, copy the **"Application (client) ID"**
2. Create a `.env.local` file in your project root
3. Add this line:
   ```
   NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_copied_client_id_here
   ```

## Step 4: Configure Redirect URIs (Production)

For production deployment:
1. Go back to **"Authentication"** in your app registration
2. Add your production URL as a redirect URI (e.g., `https://yourdomain.com`)

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Mailbox section
3. Click **"Connect Microsoft Account"**
4. Sign in with your Microsoft/Outlook account
5. Grant the requested permissions
6. Your real emails should now appear in the mailbox

## Troubleshooting

### Common Issues:

1. **"AADSTS50011: Invalid redirect URI"**
   - Make sure the redirect URI in Azure exactly matches your app URL
   - For development: `http://localhost:3000`
   - For production: your actual domain

2. **"Insufficient privileges to complete the operation"**
   - Make sure you've added the required permissions (User.Read, Mail.Read, Mail.ReadWrite)
   - Grant admin consent if needed

3. **"Client ID not found"**
   - Verify your `NEXT_PUBLIC_MICROSOFT_CLIENT_ID` in `.env.local`
   - Make sure the file is in your project root
   - Restart your development server after adding the environment variable

### Demo Mode
If you don't want to set up Microsoft integration immediately, the app will work in demo mode with sample emails.

## Security Notes

- Never commit your `.env.local` file to version control
- The client ID is safe to expose in frontend code (it's designed to be public)
- No client secret is needed for single-page applications
- All authentication happens through Microsoft's secure OAuth2 flow 