import { Contact, Deal, Company } from '../types';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Inc.',
    position: 'VP of Engineering',
    location: 'San Francisco, CA',
    status: 'prospect',
    lastContact: '2024-01-15',
    dealValue: 50000,
    tags: ['enterprise', 'technical'],
    source: 'LinkedIn'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@innovate.io',
    phone: '+1 (555) 987-6543',
    company: 'Innovate.io',
    position: 'CTO',
    location: 'New York, NY',
    status: 'customer',
    lastContact: '2024-01-20',
    dealValue: 75000,
    tags: ['startup', 'ai'],
    source: 'Referral'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@globaltech.com',
    phone: '+1 (555) 456-7890',
    company: 'GlobalTech Solutions',
    position: 'Product Manager',
    location: 'Austin, TX',
    status: 'lead',
    lastContact: '2024-01-18',
    dealValue: 25000,
    tags: ['mid-market', 'product'],
    source: 'Website'
  }
];

export const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'TechCorp Enterprise License',
    value: 50000,
    stage: 'proposal',
    probability: 75,
    contact: 'Sarah Johnson',
    company: 'TechCorp Inc.',
    closeDate: '2024-02-15',
    createdDate: '2024-01-01'
  },
  {
    id: '2',
    title: 'Innovate.io Platform Integration',
    value: 75000,
    stage: 'negotiation',
    probability: 90,
    contact: 'Michael Chen',
    company: 'Innovate.io',
    closeDate: '2024-01-30',
    createdDate: '2023-12-15'
  },
  {
    id: '3',
    title: 'GlobalTech Pilot Program',
    value: 25000,
    stage: 'qualification',
    probability: 50,
    contact: 'Emily Rodriguez',
    company: 'GlobalTech Solutions',
    closeDate: '2024-03-01',
    createdDate: '2024-01-10'
  }
];

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    industry: 'Technology',
    size: '500-1000',
    location: 'San Francisco, CA',
    website: 'techcorp.com',
    contactCount: 5,
    dealValue: 150000,
    status: 'prospect'
  },
  {
    id: '2',
    name: 'Innovate.io',
    industry: 'AI/ML',
    size: '50-100',
    location: 'New York, NY',
    website: 'innovate.io',
    contactCount: 3,
    dealValue: 225000,
    status: 'active'
  },
  {
    id: '3',
    name: 'GlobalTech Solutions',
    industry: 'Consulting',
    size: '200-500',
    location: 'Austin, TX',
    website: 'globaltech.com',
    contactCount: 7,
    dealValue: 75000,
    status: 'prospect'
  }
]; 