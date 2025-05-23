"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  FileText,
  Activity,
  Star,
  Clock,
  Target,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ContactDetailPage } from '@/modules/customer/components/ContactDetailPage';

interface Contact {
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

interface Deal {
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

interface Company {
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

// Mock data
const mockContacts: Contact[] = [
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

const mockDeals: Deal[] = [
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

const mockCompanies: Company[] = [
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

type CRMView = 'dashboard' | 'contacts' | 'deals' | 'companies' | 'activities';

interface CRMPageProps {
  selectedCustomerId?: string | null;
  onCustomerBack?: () => void;
}

export function CRMPage({ selectedCustomerId, onCustomerBack }: CRMPageProps = {}) {
  const [currentView, setCurrentView] = useState<CRMView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(selectedCustomerId || null);

  // Update selectedContactId when prop changes
  useEffect(() => {
    if (selectedCustomerId) {
      setSelectedContactId(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'prospect':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'customer':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'qualification':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'proposal':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed-won':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'closed-lost':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const generateProfilePicture = (name: string) => {
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
  };

  const handleContactView = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const handleBackToCRM = () => {
    setSelectedContactId(null);
    if (onCustomerBack) {
      onCustomerBack();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{mockContacts.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{mockDeals.filter(d => !d.stage.startsWith('closed')).length}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+8%</span> conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">
                  ${mockDeals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+15%</span> from last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{mockCompanies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+5%</span> new enterprises
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Email sent to Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Meeting scheduled with Michael Chen</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">New lead added: Emily Rodriguez</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Deal Pipeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockDeals.filter(d => !d.stage.startsWith('closed')).map((deal) => (
              <div key={deal.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{deal.title}</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStageColor(deal.stage)}>
                      {deal.stage.replace('-', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${deal.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{deal.company}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Contacts</h2>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedStatus('all')}>All Contacts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('lead')}>Leads</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('prospect')}>Prospects</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('customer')}>Customers</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockContacts
          .filter(contact => 
            selectedStatus === 'all' || contact.status === selectedStatus
          )
          .filter(contact =>
            searchQuery === '' || 
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.company.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleContactView(contact.id)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={generateProfilePicture(contact.name)} alt={contact.name} />
                      <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{contact.name}</h3>
                      <p className="text-sm text-muted-foreground">{contact.position}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContactView(contact.id); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.company}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(contact.status)}>
                    {contact.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">${contact.dealValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Deal value</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Add "View Details" overlay on hover */}
                <div className="mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleContactView(contact.id); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Customer 360
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );

  const renderDeals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Deals</h2>
          <p className="text-muted-foreground">Track your sales opportunities</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-4 text-left font-medium">Deal</th>
                  <th className="p-4 text-left font-medium">Value</th>
                  <th className="p-4 text-left font-medium">Stage</th>
                  <th className="p-4 text-left font-medium">Probability</th>
                  <th className="p-4 text-left font-medium">Contact</th>
                  <th className="p-4 text-left font-medium">Close Date</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockDeals.map((deal) => (
                  <tr key={deal.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.company}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium">${deal.value.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge className={getStageColor(deal.stage)}>
                        {deal.stage.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">{deal.probability}%</td>
                    <td className="p-4">{deal.contact}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(deal.closeDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Deal
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompanies = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Companies</h2>
          <p className="text-muted-foreground">Manage your business accounts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(company.status)}>
                  {company.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span>{company.size} employees</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span>{company.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contacts</span>
                  <span>{company.contactCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deal Value</span>
                  <span className="font-medium">${company.dealValue.toLocaleString()}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <a 
                  href={`https://${company.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {company.website}
                </a>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Company
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'contacts':
        return renderContacts();
      case 'deals':
        return renderDeals();
      case 'companies':
        return renderCompanies();
      default:
        return renderDashboard();
    }
  };

  if (selectedContactId) {
    return <ContactDetailPage contactId={selectedContactId} onBack={handleBackToCRM} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-14 items-center px-6 space-x-6">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={currentView === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('contacts')}
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </Button>
          <Button
            variant={currentView === 'deals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('deals')}
          >
            <Target className="h-4 w-4 mr-2" />
            Deals
          </Button>
          <Button
            variant={currentView === 'companies' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('companies')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Companies
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </div>
    </div>
  );
} 