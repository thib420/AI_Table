export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  lastContact: string;
  dealValue: number;
  avatar?: string;
  tags: string[];
  source: string;
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

export type CRMView = 'dashboard' | 'contacts' | 'deals' | 'companies' | 'activities';

export interface CRMPageProps {
  selectedCustomerId?: string | null;
  onCustomerBack?: () => void;
} 