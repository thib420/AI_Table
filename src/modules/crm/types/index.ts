export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: string;
  lastContact: string;
  dealValue: number;
  avatar?: string;
  tags: string[];
  source: string;
  graphType?: 'contact' | 'person' | 'user' | 'unknown';
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  contact: string;
  company: string;
  closeDate: string;
  createdDate: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  contactCount: number;
  dealValue: number;
  status: 'active' | 'prospect' | 'inactive';
}

// New types for Customer 360 view
export interface CustomerEmail {
  id: string;
  subject: string;
  preview: string;
  sender: string;
  senderEmail: string;
  receivedDateTime: string;
  isRead: boolean;
  importance: 'low' | 'normal' | 'high';
  hasAttachments: boolean;
  direction: 'inbound' | 'outbound';
}

export interface CustomerMeeting {
  id: string;
  subject: string;
  start: string;
  end: string;
  location?: string;
  attendees: string[];
  organizer: string;
  isOnline: boolean;
  meetingUrl?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface CustomerDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: string;
  sharedBy: string;
  url: string;
  isShared: boolean;
}

export interface CustomerInteraction {
  id: string;
  type: 'email' | 'meeting' | 'call' | 'document' | 'note';
  title: string;
  description: string;
  date: string;
  direction?: 'inbound' | 'outbound';
  importance: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface CustomerProfile {
  contact: Contact;
  emails: CustomerEmail[];
  meetings: CustomerMeeting[];
  documents: CustomerDocument[];
  interactions: CustomerInteraction[];
  stats: {
    totalEmails: number;
    totalMeetings: number;
    totalDocuments: number;
    lastInteraction: string;
    responseTime: string;
    engagementScore: number;
  };
  timeline: CustomerInteraction[];
}

export type CRMView = 'dashboard' | 'contacts' | 'deals' | 'companies' | 'activities' | 'customer-360';

export interface CRMPageProps {
  selectedCustomerId?: string | null;
  onCustomerBack?: () => void;
} 