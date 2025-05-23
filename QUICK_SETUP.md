# 🔧 Quick Microsoft Graph Setup

## Fix the Authentication Error

The "client_id" error means Microsoft Graph is not configured yet. Follow these steps:

### 1. Create Environment File
```bash
# In your project root, create .env.local
touch .env.local
```

### 2. Add Microsoft Client ID
```bash
# Add this line to .env.local (replace with your actual client ID)
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_actual_client_id_here
```

### 3. Get Your Client ID
- Follow the detailed steps in `MICROSOFT_SETUP.md`
- Or use these quick steps:
  1. Go to [Azure Portal](https://portal.azure.com)
  2. Navigate to Azure Active Directory → App registrations
  3. Create new registration with SPA redirect URI: `http://localhost:3000`
  4. Copy the "Application (client) ID"
  5. Add API permissions: User.Read, Mail.Read, Mail.ReadWrite

### 4. Restart Development Server
```bash
npm run dev
```

## Current Behavior

- ✅ **Landing page works** (no Microsoft auth needed)
- ✅ **Demo mode works** (sample emails shown)
- ❌ **Real email connection fails** (needs Microsoft client ID)

## After Setup

- ✅ **Single sign-in experience** (no double authentication)
- ✅ **Real email access** from Microsoft/Outlook
- ✅ **Seamless integration** between landing page and mailbox

---

**Need help?** Check `MICROSOFT_SETUP.md` for detailed Azure setup instructions. 