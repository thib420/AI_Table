# Business Suite - Comprehensive Sales & Marketing Platform

## Overview

This application has been transformed from a simple AI Table into a comprehensive business suite with four integrated modules for complete sales and marketing workflow management. The platform now features a **Customer 360 view** that provides complete customer information across all business modules.

## 🏗️ Architecture

### Main Navigation Structure
- **MainLayout**: Top-level navigation and user management with global customer search
- **Module Router**: Switches between different business modules
- **Integrated Authentication**: Single sign-on across all modules
- **Customer 360 Integration**: Unified customer data access from any module

## 🎯 Customer 360 Feature

### Comprehensive Customer View
**Purpose**: Unified dashboard showing all customer interactions, history, and data across the entire business suite

**Key Features**:
- 📊 **Customer Overview Dashboard**: Key metrics including total revenue, lifetime value, active deals, and email response rates
- 🔍 **Global Search**: Search for customers from any module and access their 360 view instantly
- 📧 **Email Integration**: View all email conversations, track response rates, and engagement history
- 🤝 **Meeting & Call History**: Complete timeline of all customer interactions
- 💼 **Deal Pipeline**: All deals associated with the customer, current and historical
- 🛒 **Order History**: Complete purchase history with invoices and delivery tracking
- 📄 **Document Library**: All shared documents, contracts, and files
- 📈 **Activity Timeline**: Chronological view of all customer touchpoints
- 🏷️ **Customer Insights**: Revenue analytics, engagement patterns, and relationship health

### Integration Points
- **From CRM**: Direct access from contact cards
- **From Mailbox**: View customer details from any email conversation
- **From Email Campaigns**: Access customer profiles from campaign analytics
- **From AI Table**: Convert prospects to full customer profiles
- **Global Search**: Find and access any customer from the header search bar

### Customer Data Aggregation
- Contact information and social profiles
- All email communications (sent/received)
- Meeting and call history
- Deal progression and sales pipeline
- Order history and purchase patterns
- Document sharing and collaboration history
- Marketing campaign interactions
- Support tickets and resolutions
- Revenue and lifetime value tracking

## 📊 Business Modules

### 1. AI Table (Lead Prospection)
**Purpose**: Search and analyze professional LinkedIn profiles with AI-powered insights

**Features**:
- 🔍 Professional profile search with advanced filters
- 🤖 AI-powered data enhancement (position titles, company extraction)
- 📋 Dynamic column management with custom AI columns
- 💾 Save and load search configurations
- 📈 Export capabilities for lead generation
- 🎯 Smart filtering and sorting
- 📱 Mobile-responsive interface
- **🆕 Customer Integration**: Convert prospects to CRM contacts with full customer 360 setup

**AI Capabilities**:
- Extract clean position titles from LinkedIn profiles
- Identify company names automatically
- Generate custom insights (contact potential, industry analysis, etc.)
- Real-time data processing with visual feedback

### 2. CRM (Customer Relationship Management)
**Purpose**: Manage contacts, deals, and customer relationships with complete customer 360 view

**Features**:
- 👥 **Contact Management**: Store and organize customer information
- 💼 **Deal Pipeline**: Track sales opportunities through stages
- 🏢 **Company Management**: Manage business accounts
- 📊 **Dashboard**: Visual metrics and performance tracking
- 🔍 **Advanced Search**: Find contacts, companies, and deals
- 🏷️ **Tagging System**: Organize data with custom tags
- 📈 **Performance Analytics**: Track conversion rates and deal values
- **🆕 Customer 360 View**: Comprehensive customer information aggregated from all modules

**Contact Features**:
- Profile pictures with automatic avatar generation
- Custom status tracking (lead, prospect, customer, inactive)
- Deal value tracking per contact
- Last contact date tracking
- Source attribution (LinkedIn, referral, website, etc.)
- **🆕 One-click access to complete customer timeline and history**

### 3. Mailbox (Outlook Integration)
**Purpose**: Integrated email management with Outlook connectivity and customer context

**Features**:
- 📧 **Email Management**: Read, compose, and organize emails
- 📁 **Folder System**: Inbox, sent, drafts, archive, starred
- 🔍 **Email Search**: Find emails across all folders
- 📎 **Attachment Handling**: Manage email attachments
- ⭐ **Email Starring**: Mark important emails
- 🔄 **Outlook Sync**: Real-time synchronization with Outlook
- 📅 **Calendar Integration**: Schedule meetings directly from emails
- **🆕 Customer Context**: View customer 360 directly from email conversations
- **🆕 CRM Integration**: Add email contacts directly to CRM with full history

**Customer Integration**:
- Automatic customer identification from email addresses
- Quick access to customer 360 view from any email
- Email history integration with customer timeline
- Meeting scheduling with customer context

### 4. Email Campaign (Marketing Automation)
**Purpose**: Create and manage email marketing campaigns with customer insights

**Features**:
- 📧 **Campaign Management**: Create and schedule email campaigns
- 📊 **Performance Analytics**: Track open rates, click rates, conversions
- 🎨 **Template Library**: Pre-designed email templates
- 🎯 **Audience Segmentation**: Target specific customer groups
- 📈 **A/B Testing**: Test different campaign variations
- 🔄 **Automation Workflows**: Set up drip campaigns and sequences
- 📱 **Mobile Optimization**: Responsive email designs
- **🆕 Customer Engagement Analytics**: View top engaging customers with direct access to their 360 profiles
- **🆕 Campaign-to-Customer Mapping**: Track individual customer responses and behaviors

**Customer Integration**:
- Top engaging customers dashboard
- Individual customer campaign performance
- Direct access to customer 360 from campaign analytics
- Customer journey tracking across campaigns

## 🛠️ Technical Features

### Authentication & Security
- Azure AD OAuth integration
- Secure session management
- Role-based access control
- Data encryption

### Data Management
- Supabase backend integration
- Real-time data synchronization
- Automatic backups
- Data export capabilities
- **🆕 Cross-module data aggregation for Customer 360**

### AI Integration
- Gemini AI for data enhancement
- Custom column generation
- Intelligent data extraction
- Real-time processing with animations

### User Experience
- Modern shadcn/ui components
- Dark/light theme support
- Mobile-responsive design
- Intuitive navigation
- Real-time notifications
- **🆕 Global customer search with instant access**
- **🆕 Contextual customer information across all modules**

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Azure AD application (for authentication)
- Gemini AI API key

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd AI_Table

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
EXA_API_KEY=your_exa_api_key
```

## 📱 Navigation

### Module Switching
- Click on module icons in the left sidebar
- Each module maintains its own state
- Seamless transitions between modules
- Context preservation
- **🆕 Customer context maintained across module switches**

### Global Customer Search
- **Search Bar**: Located in the header, accessible from any module
- **Instant Results**: Real-time customer search with avatar previews
- **Quick Access**: Click on any customer to view their 360 profile
- **Cross-Module Navigation**: Search automatically switches to CRM module

### Customer 360 Navigation
- **Tab-based Interface**: Overview, Activities, Deals, Orders, Documents, Emails
- **Activity Timeline**: Chronological view of all customer interactions
- **Quick Actions**: Send email, schedule calls, book meetings, add notes
- **Integration Links**: Jump to related modules with customer context preserved

### Quick Actions
- **New Contact**: Add contacts from any module
- **Analytics**: Quick access to performance metrics
- **Search**: Universal search across all modules
- **🆕 Customer 360**: Access comprehensive customer information from anywhere

## 🔮 Future Enhancements

### Planned Features
1. **Advanced Analytics Dashboard**
   - Cross-module analytics
   - Revenue forecasting
   - Customer lifetime value predictions
   - **🆕 Customer journey analytics**
   - **🆕 Predictive customer insights**

2. **API Integrations**
   - HubSpot CRM sync
   - Salesforce integration
   - Zapier automation
   - **🆕 Microsoft Graph API for enhanced Outlook integration**

3. **Mobile App**
   - Native iOS/Android apps
   - Offline functionality
   - Push notifications
   - **🆕 Mobile Customer 360 view**

4. **AI Enhancements**
   - Predictive lead scoring
   - Automated email content generation
   - Smart campaign optimization
   - **🆕 AI-powered customer insights and recommendations**
   - **🆕 Automated customer health scoring**

### Integration Roadmap
- **Phase 1**: Enhanced Outlook integration with real-time sync
- **Phase 2**: Advanced automation workflows and customer journey mapping
- **Phase 3**: Machine learning predictions and customer behavior analysis
- **Phase 4**: Custom reporting dashboard with advanced customer analytics

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use shadcn/ui components consistently
3. Implement proper error handling
4. Add comprehensive tests
5. Document new features
6. **🆕 Ensure Customer 360 integration for new features**

### Code Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── MainLayout.tsx  # Main navigation with global search
│   ├── AppLayout.tsx   # AI Table module
│   ├── CRMPage.tsx     # CRM module
│   ├── ContactDetailPage.tsx # Customer 360 view
│   ├── MailboxPage.tsx # Email module
│   └── EmailCampaignPage.tsx # Campaign module
├── lib/                # Utilities and helpers
├── contexts/           # React contexts
└── types/              # TypeScript definitions
```

## 📞 Support

For technical support or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with**: Next.js, TypeScript, Supabase, shadcn/ui, Tailwind CSS, and AI integration

**New in v2.0**: Customer 360 view, global customer search, and cross-module customer data integration 