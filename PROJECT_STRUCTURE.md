# Project Structure

This document outlines the new organized, scalable structure of the AI Table application.

## Overview

The project follows a **feature-based modular architecture** with clear separation of concerns:

```
src/
├── app/                     # Next.js App Router
├── components/              # Reusable UI components
├── modules/                 # Feature modules (business logic)
├── shared/                  # Cross-cutting concerns
└── assets/                  # Static assets (future)
```

## Detailed Structure

### 📁 `src/app/` - Next.js App Router
```
app/
├── api/                    # API routes
│   ├── exa/               # Exa search API
│   └── gemini/            # Gemini AI API
├── auth/                  # Authentication pages
├── landingpage/           # Landing page routes
├── table/                 # Table view routes
├── layout.tsx             # Root layout
├── page.tsx               # Main application
└── globals.css            # Global styles
```

### 📁 `src/components/` - Reusable UI Components
```
components/
├── ui/                    # Base UI components (Radix UI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── layout/                # Layout-specific components
│   ├── AppLayout.tsx      # Main search layout
│   └── MainLayout.tsx     # Navigation layout
├── common/                # Common utility components
│   ├── ColumnFilter.tsx   # Data filtering
│   ├── ColumnSort.tsx     # Data sorting
│   ├── DemoModal.tsx      # Demo modal
│   └── theme-provider.tsx # Theme management
└── index.ts               # Barrel exports
```

### 📁 `src/modules/` - Feature Modules

Each module is self-contained with its own components, services, types, and utilities.

#### 🔍 `modules/search/` - AI Search Functionality
```
search/
├── components/
│   ├── SearchHistoryManager.tsx
│   └── ResultsTable/
├── services/
│   └── ai-column-generator.ts
├── hooks/                 # Search-specific hooks
├── types/                 # Search-specific types  
├── utils/                 # Search utilities
└── index.ts               # Module exports
```

**Responsibilities:**
- LinkedIn profile search using Exa API
- AI-powered column generation with Gemini
- Search history management
- Results table rendering

#### 📧 `modules/mailbox/` - Email Management
```
mailbox/
├── components/
│   ├── MailboxPage.tsx
│   └── MailboxPage/       # Sub-components
│       ├── MailboxList.tsx
│       ├── MailboxSidebar.tsx
│       ├── MailboxDetail.tsx
│       └── useMailbox.ts
├── services/
│   ├── microsoft-graph.ts
│   └── MicrosoftAuthContext.tsx
├── hooks/                 # Email-specific hooks
├── types/                 # Email-specific types
├── utils/                 # Email utilities
└── index.ts
```

**Responsibilities:**
- Microsoft Graph API integration
- Real email access and management
- Email reading, starring, folder navigation
- Microsoft authentication

#### 👥 `modules/crm/` - Customer Relationship Management
```
crm/
├── components/
│   └── CRMPage.tsx
├── services/              # CRM services
├── hooks/                 # CRM-specific hooks
├── types/                 # CRM types
├── utils/                 # CRM utilities
└── index.ts
```

**Responsibilities:**
- Contact management
- Deal tracking
- Customer interactions
- CRM data management

#### 👤 `modules/customer/` - Customer 360 View
```
customer/
├── components/
│   └── ContactDetailPage.tsx
├── services/              # Customer services
├── hooks/                 # Customer-specific hooks
├── types/                 # Customer types
├── utils/                 # Customer utilities
└── index.ts
```

**Responsibilities:**
- Comprehensive customer profiles
- 6-tab customer interface (Overview, Activities, Deals, Orders, Documents, Emails)
- Customer interaction timeline
- Cross-module customer data aggregation

#### 📬 `modules/campaigns/` - Email Campaigns
```
campaigns/
├── components/
│   └── EmailCampaignPage.tsx
├── services/              # Campaign services
├── hooks/                 # Campaign-specific hooks
├── types/                 # Campaign types
├── utils/                 # Campaign utilities
└── index.ts
```

**Responsibilities:**
- Email campaign management
- Campaign analytics
- Customer engagement tracking
- Campaign performance metrics

#### 🏠 `modules/landing/` - Landing Page
```
landing/
├── components/
│   └── LandingPage.tsx
├── services/              # Landing services
├── hooks/                 # Landing-specific hooks
├── types/                 # Landing types
├── utils/                 # Landing utilities
└── index.ts
```

**Responsibilities:**
- User onboarding
- Authentication flows
- Product showcasing
- Getting started guides

#### 🔐 `modules/auth/` - Authentication (Future)
```
auth/
├── components/            # Auth components
├── services/              # Auth services
├── hooks/                 # Auth hooks
├── types/                 # Auth types
├── utils/                 # Auth utilities
└── index.ts
```

### 📁 `src/shared/` - Cross-cutting Concerns
```
shared/
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Supabase authentication
├── lib/                   # Shared libraries
│   ├── supabase/          # Supabase client
│   └── utils.ts           # Utility functions
├── types/                 # Shared TypeScript types
│   └── exa.ts             # Exa API types
├── config/                # Configuration files
└── hooks/                 # Shared custom hooks
```

## Module Communication

### Inter-module Communication
- **Props drilling**: For simple parent-child communication
- **Shared contexts**: For global state (auth, theme)
- **Custom hooks**: For shared logic between modules
- **Events**: For loose coupling between modules

### Example Communication Patterns

```typescript
// 1. From Mailbox to Customer 360
// MailboxPage.tsx
<MailboxDetail 
  email={selectedEmail} 
  onViewCustomer={(email) => onCustomerView(email)} 
/>

// 2. From CRM to Customer 360  
// CRMPage.tsx
<ContactCard 
  contact={contact}
  onViewDetails={(id) => onCustomerView(id)}
/>

// 3. Global Customer Navigation
// MainLayout.tsx - Global search
const handleCustomerSearch = (customerId: string) => {
  onCustomerView(customerId);
  setCurrentModule('crm');
};
```

## Import Patterns

### Module Imports
```typescript
// Clean barrel imports from modules
import { MailboxPage } from '@/modules/mailbox';
import { CRMPage } from '@/modules/crm';
import { ContactDetailPage } from '@/modules/customer';

// Specific component imports when needed
import { useMailbox } from '@/modules/mailbox/components/MailboxPage/useMailbox';
```

### Shared Imports
```typescript
// Shared contexts and utilities
import { useAuth } from '@/shared/contexts/AuthContext';
import { cn } from '@/shared/lib/utils';

// UI components
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
```

## Benefits of This Structure

### 🏗️ **Scalability**
- Each module can grow independently
- Clear boundaries prevent code mixing
- Easy to add new features as modules

### 🔧 **Maintainability**
- Related code is co-located
- Easy to find and modify functionality
- Clear dependency relationships

### 👥 **Team Collaboration**
- Different teams can work on different modules
- Reduced merge conflicts
- Clear ownership boundaries

### 🧪 **Testing**
- Modules can be tested in isolation
- Easy to mock dependencies
- Clear test boundaries

### 📦 **Code Reusability**
- Shared components in dedicated directories
- Module-specific code stays contained
- Easy to extract modules to separate packages

## Development Guidelines

### Adding New Features
1. Determine if it belongs to an existing module
2. If new module: create the full directory structure
3. Add barrel exports to index.ts
4. Update this documentation

### Cross-module Dependencies
1. Prefer shared contexts over direct imports
2. Use props for data flow between modules
3. Keep modules as independent as possible
4. Document any tight coupling

### File Naming Conventions
- **Components**: PascalCase (e.g., `MailboxPage.tsx`)
- **Services**: camelCase (e.g., `microsoft-graph.ts`)
- **Hooks**: camelCase starting with 'use' (e.g., `useMailbox.ts`)
- **Types**: camelCase (e.g., `email-types.ts`)
- **Utils**: camelCase (e.g., `email-utils.ts`)

This structure provides a solid foundation for scaling the application while maintaining code quality and developer productivity. 