# Campaigns Module

A comprehensive email campaign management system with advanced contact selection by people and categories (tags), and a **dedicated email sequence builder page**.

## 📁 Structure

```
src/modules/campaigns/
├── components/
│   ├── EmailCampaignPage.tsx        # Main campaign dashboard
│   ├── CreateCampaignDialog.tsx     # Campaign creation wizard
│   ├── ContactSelector.tsx          # People & Categories selection
│   ├── EmailSequenceBuilder.tsx    # Advanced email sequence component
│   ├── EmailSequenceBuilderPage.tsx # ⭐ NEW: Dedicated full-page sequence builder
│   ├── CampaignStats.tsx           # Campaign statistics cards
│   ├── CampaignFilters.tsx         # Search and filter controls
│   └── CampaignsList.tsx           # Campaigns table/list view
├── types/
│   └── index.ts                    # TypeScript interfaces
└── index.ts                       # Module exports
```

## 🎯 Pages & Navigation

### 📄 Available Pages

1. **`/campaigns`** - Main campaign dashboard
   - Overview of all campaigns
   - Templates library
   - Analytics dashboard  
   - **NEW**: Sequence Builder tab

2. **`/campaigns/sequence-builder`** - ⭐ **Dedicated Email Sequence Builder**
   - Full-page experience for building email sequences
   - Advanced template library integration
   - Visual sequence builder with expanded canvas
   - Real-time saving and preview capabilities
   - Campaign management tools

### 🧭 Navigation Flow

```
Campaign Dashboard (/campaigns)
├── Campaigns Tab (default)
├── Templates Tab
├── Analytics Tab
├── Automation Tab
└── Sequence Tab ← NEW
    ├── Quick Actions (Welcome Series, Product Launch, etc.)
    ├── "Create New Sequence" → /campaigns/sequence-builder
    └── Recent Sequences List

Dedicated Sequence Builder (/campaigns/sequence-builder)
├── Campaign Overview Cards
├── Full Email Sequence Builder
├── Advanced Actions (Save, Preview, Launch)
└── Options Menu (Edit Audience, Settings, etc.)
```

## 🚀 Key Features

### 📧 Campaign Management
- **Multi-step campaign creation wizard**
- **Advanced email sequence builder** with templates and personalization
- **Campaign scheduling** with timezone support
- **Real-time statistics** and analytics
- **Campaign filtering** and search

### 👥 Contact Selection
- **People selection** - Individual contact selection with search and filters
- **Categories selection** - Tag-based group selection for bulk operations
- **Advanced search** across names, emails, companies
- **Visual selection feedback** with avatars and badges
- **Batch operations** (Select All, Clear All)
- **Tag-based organization** using the CRM module's common tags

### ✉️ Email Sequence Builder
- **Visual sequence builder** with drag-and-drop functionality
- **Pre-built email templates** (Welcome, Follow-up, Nurture, etc.)
- **Delay configuration** with presets and custom timing
- **Email personalization** with template variables
- **Live preview** of email content
- **Expand/collapse** for detailed editing
- **Duplicate and reorder** emails in sequence
- **Active/inactive toggles** for each step
- **Sequence analytics** and overview dashboard

### 📈 Analytics & Tracking
- **Campaign performance metrics**
- **Open/Click rate tracking**
- **Conversion analytics**
- **Historical data visualization**

## 🧩 Components

### 1. EmailCampaignPage
**Main dashboard component with tabbed interface**
- Campaigns overview and management
- Templates library
- Analytics dashboard
- Navigation between different views

### 2. CreateCampaignDialog
**4-step campaign creation wizard**
1. **Campaign Details**: Basic info, type, tags
2. **Target Audience**: People/category selection
3. **Email Sequence**: Advanced sequence builder
4. **Schedule & Launch**: Timing and final review

### 3. ContactSelector
**Advanced people and category selection interface**
- **Dual tabs**: Individual people vs. Categories (tags)
- **Real-time search** across multiple fields
- **Visual selection** with checkboxes and highlighting
- **Bulk actions** for efficiency
- **Category-based selection** using predefined tags
- **Data integration hooks** for loading contacts

### 4. EmailSequenceBuilder ⭐ **NEW**
**Dedicated email sequence creation component**
- **Template Library**: Pre-built templates for common use cases
- **Visual Builder**: Drag-and-drop sequence construction
- **Smart Delays**: Preset timing options (1 hour, 1 day, 1 week, etc.)
- **Rich Editor**: Subject line and content editing with personalization
- **Live Preview**: Real-time email preview functionality
- **Sequence Overview**: Statistics showing total emails, active count, duration
- **Advanced Features**: Duplicate, reorder, activate/deactivate steps

### 5. Modular Components
- **CampaignStats**: Reusable statistics cards
- **CampaignFilters**: Search and filter controls
- **CampaignsList**: Table view with actions

## 🎯 Usage

### Basic Campaign Creation
```typescript
import { EmailCampaignPage } from '@/modules/campaigns';

function MyPage() {
  return <EmailCampaignPage onCustomerView={handleCustomerView} />;
}
```

### Standalone Email Sequence Builder
```typescript
import { EmailSequenceBuilder } from '@/modules/campaigns';
import { EmailSequenceStep } from '@/modules/campaigns/types';

function MyComponent() {
  const [emailSequence, setEmailSequence] = useState<EmailSequenceStep[]>([]);

  return (
    <EmailSequenceBuilder
      emailSequence={emailSequence}
      onSequenceChange={setEmailSequence}
      className="w-full"
    />
  );
}
```

### Standalone Contact Selection with Data Integration
```typescript
import { ContactSelector } from '@/modules/campaigns';
import { contactService } from '@/services/contactService';

function MyComponent() {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const loadAllContacts = async () => {
    const allContacts = await contactService.getAllContacts();
    setContacts(allContacts);
    return allContacts;
  };

  const loadContactsByTag = async (tag: string) => {
    return await contactService.getContactsByTag(tag);
  };

  return (
    <ContactSelector
      open={isOpen}
      onOpenChange={setIsOpen}
      selectedContacts={selectedContacts}
      onContactsChange={setSelectedContacts}
      contacts={contacts}
      onLoadContacts={loadAllContacts}
      onLoadContactsByTag={loadContactsByTag}
    />
  );
}
```

## 🔧 Configuration

### Contact Data Integration
The `ContactSelector` component is designed to work with your data source:

#### Required Props
- `open`: Dialog open state
- `onOpenChange`: Dialog state handler
- `selectedContacts`: Array of selected contact IDs
- `onContactsChange`: Handler for contact selection changes

#### Optional Data Props
- `contacts`: Array of Contact objects to display
- `onLoadContacts`: Async function to load all contacts
- `onLoadContactsByTag`: Async function to load contacts by tag

### Email Sequence Builder Integration
The `EmailSequenceBuilder` component can be used standalone or within the campaign wizard:

#### Props
- `emailSequence`: Array of EmailSequenceStep objects
- `onSequenceChange`: Handler for sequence updates
- `className`: Optional CSS classes

#### Features Configuration
```typescript
// Built-in email templates
const EMAIL_TEMPLATES = [
  {
    id: 'welcome-1',
    name: 'Welcome Email',
    category: 'welcome',
    subject: 'Welcome to {{company_name}}! 🎉',
    content: 'Hi {{first_name}}, Welcome to {{company_name}}!...'
  },
  // ... more templates
];

// Delay presets for easy timing configuration
const DELAY_PRESETS = [
  { label: 'Immediately', days: 0, hours: 0 },
  { label: '1 hour', days: 0, hours: 1 },
  { label: '1 day', days: 1, hours: 0 },
  { label: '1 week', days: 7, hours: 0 },
  // ... more presets
];
```

#### Integration Example
```typescript
// In your CreateCampaignDialog or parent component
<EmailSequenceBuilder
  emailSequence={campaignData.emailSequence}
  onSequenceChange={(sequence) => setCampaignData(prev => ({ 
    ...prev, 
    emailSequence: sequence 
  }))}
/>
```

### Category System
Categories are based on the common tags from the CRM module:
- `VIP`, `Enterprise`, `SMB`, `Startup`
- `Technology`, `Healthcare`, `Finance`, `Education`
- `Hot-lead`, `Cold-lead`, `Warm-lead`
- `Decision-maker`, `Influencer`, `Champion`

### Campaign Backend Integration
Update the `handleCampaignCreate` function in `EmailCampaignPage.tsx` to:
- Send campaign data to your API
- Handle validation and error states
- Implement real-time updates

## 📊 Data Flow

### Campaign Creation Flow
1. User clicks "New Campaign"
2. `CreateCampaignDialog` opens with 4-step wizard
3. In step 2, `ContactSelector` manages people/category selection
4. In step 3, `EmailSequenceBuilder` handles sequence creation
5. Final review and launch in step 4
6. Campaign data is passed to parent component

### Email Sequence Building Flow
1. `EmailSequenceBuilder` renders with current sequence
2. User can add emails from templates or create from scratch
3. Each email step can be expanded for detailed editing
4. Drag-and-drop or arrow controls for reordering
5. Real-time preview and delay configuration
6. Sequence changes are passed back to parent via `onSequenceChange`

### Contact Selection Flow
1. `ContactSelector` renders tabs for people/categories
2. Search filters data in real-time
3. User selects individuals or categories with checkboxes
4. Category selection automatically includes all tagged contacts
5. Selection state is managed and synchronized
6. Selected contact IDs are returned to parent

## 🏷️ Tag-Based Selection

### How Categories Work
- Categories represent predefined tags from the CRM system
- Selecting a category includes all contacts with that tag
- Category selection is additive (contacts from multiple categories)
- Real-time preview shows contact count per category
- Category contacts can be loaded asynchronously via `onLoadContactsByTag`

### Contact Tagging
Contacts should have a `tags` property that matches the category names:
```typescript
interface Contact {
  id: string;
  name: string;
  email: string;
  tags?: string[]; // e.g., ['Enterprise', 'Decision-maker', 'VIP']
  // ... other properties
}
```

## 🎨 Customization

### Email Templates
Add custom templates to the `EMAIL_TEMPLATES` array:
```typescript
{
  id: 'custom-1',
  name: 'Custom Template',
  subject: 'Your custom subject with {{variables}}',
  content: 'Your email content...',
  category: 'promotional',
  description: 'Description of your template'
}
```

### Delay Presets
Customize timing options in `DELAY_PRESETS`:
```typescript
{ label: 'Custom timing', days: 5, hours: 12 }
```

### Styling
All components use shadcn/ui and Tailwind CSS:
- Customize colors via Tailwind config
- Override component styles via CSS classes
- Use design tokens for consistency

### Functionality Extensions
- Add custom categories/tags
- Implement advanced analytics
- Add campaign automation triggers
- Extend email personalization options

## 🔮 Future Enhancements

### Planned Features
- [ ] **WYSIWYG Email Editor** with rich text formatting
- [ ] **A/B Testing** for subject lines and content
- [ ] **Advanced Automation** with trigger-based sequences
- [ ] **Dynamic Categories** - user-defined tag groups
- [ ] **Conditional Logic** - branching based on user behavior
- [ ] **Real-time Collaboration** for team campaigns
- [ ] **Advanced Analytics** with category-based reporting
- [ ] **Email Personalization Engine** with dynamic content

### Integration Opportunities
- **CRM Systems**: Sync contacts and track interactions
- **Email Providers**: Connect with SendGrid, Mailgun, etc.
- **Analytics Tools**: Google Analytics, Mixpanel integration
- **Automation Platforms**: Zapier, Make.com connections

## 📝 Types Reference

### Core Interfaces
```typescript
interface Campaign extends CampaignData {
  id: string;
  subject: string;
  recipients: number;
  sent: number;
  opens: number;
  clicks: number;
  conversions: number;
  createdDate: string;
  template: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  tags?: string[]; // Used for category-based selection
}

interface EmailSequenceStep {
  id: string;
  name: string;
  subject: string;
  content: string;
  delayDays: number;
  delayHours: number;
  isActive: boolean;
  template?: string;
  personalizations?: {
    [key: string]: string;
  };
}

interface EmailSequenceBuilderProps {
  emailSequence: EmailSequenceStep[];
  onSequenceChange: (sequence: EmailSequenceStep[]) => void;
  className?: string;
}

interface ContactSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContacts: string[];
  onContactsChange: (contacts: string[]) => void;
  // Optional data integration props
  contacts?: Contact[];
  onLoadContacts?: () => Promise<Contact[]>;
  onLoadContactsByTag?: (tag: string) => Promise<Contact[]>;
}
```

## 🔗 Integration with CRM Module

The campaigns module integrates seamlessly with the CRM module:
- Uses the same tag system for contact categorization
- Contacts can be imported from CRM contact lists
- Campaign results can be tracked back to CRM records
- Shared contact interface ensures consistency

---

The campaigns module provides a complete foundation for email marketing automation with people and category-based selection, advanced sequence building, modern UI/UX patterns, and extensible architecture. 🚀 