// Campaign related types

export interface EmailSequenceStep {
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

export interface CampaignData {
  name: string;
  description: string;
  type: 'email' | 'drip' | 'newsletter' | 'promotional';
  audience: string[];
  startDate: string;
  endDate?: string;
  timezone: string;
  emailSequence: EmailSequenceStep[];
  tags: string[];
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
  createdDate?: string;
  scheduledDate?: string;
}

export interface Campaign extends CampaignData {
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

export interface Template {
  id: string;
  name: string;
  type: 'welcome' | 'follow-up' | 'newsletter' | 'promotion' | 'custom';
  description: string;
  thumbnail: string;
  isActive: boolean;
  content?: string;
  subject?: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalConversions: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  topEngagingContacts: Array<{
    name: string;
    email: string;
    company: string;
    opens: number;
    clicks: number;
    conversions: number;
  }>;
}

export type CampaignView = 'campaigns' | 'templates' | 'analytics' | 'automation' | 'sequence';

export interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreate?: (campaign: CampaignData) => void;
}

export interface EmailCampaignPageProps {
  onCustomerView?: (customerId: string) => void;
}

// Contact Selection Types
export interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  tags?: string[];
  isSelected?: boolean;
}

export interface ContactSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContacts: string[];
  onContactsChange: (contacts: string[]) => void;
  // Optional props for data integration
  contacts?: Contact[];
  onLoadContacts?: () => Promise<Contact[]>;
  onLoadContactsByTag?: (tag: string) => Promise<Contact[]>;
}

// Campaign Component Props
export interface CampaignStatsProps {
  campaigns: Campaign[];
}

export interface CampaignFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onNewCampaign: () => void;
}

export interface CampaignsListProps {
  campaigns: Campaign[];
  searchQuery: string;
  selectedStatus: string;
  onViewCustomer?: (customerId: string) => void;
}

export interface TemplateGridProps {
  templates: Template[];
}

export interface AnalyticsDashboardProps {
  campaigns: Campaign[];
  onViewCustomer?: (customerId: string) => void;
} 