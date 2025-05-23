"use client";

import React, { useState } from 'react';
import { 
  Send, 
  Mail, 
  Users, 
  TrendingUp, 
  Calendar, 
  Eye, 
  MousePointerClick, 
  UserCheck,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Settings,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'drip' | 'newsletter' | 'promotional';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
  subject: string;
  recipients: number;
  sent: number;
  opens: number;
  clicks: number;
  conversions: number;
  createdDate: string;
  scheduledDate?: string;
  template: string;
  tags: string[];
}

interface Template {
  id: string;
  name: string;
  type: 'welcome' | 'follow-up' | 'newsletter' | 'promotion' | 'custom';
  description: string;
  thumbnail: string;
  isActive: boolean;
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q1 Product Launch',
    type: 'promotional',
    status: 'active',
    subject: 'Introducing Our Revolutionary New Platform',
    recipients: 2500,
    sent: 2500,
    opens: 1250,
    clicks: 187,
    conversions: 23,
    createdDate: '2024-01-15',
    template: 'Product Launch Template',
    tags: ['product', 'launch', 'q1']
  },
  {
    id: '2',
    name: 'Welcome Series - New Users',
    type: 'drip',
    status: 'active',
    subject: 'Welcome to AI Table - Let\'s Get Started!',
    recipients: 150,
    sent: 145,
    opens: 98,
    clicks: 42,
    conversions: 15,
    createdDate: '2024-01-10',
    template: 'Welcome Email Template',
    tags: ['welcome', 'onboarding']
  },
  {
    id: '3',
    name: 'Monthly Newsletter - February',
    type: 'newsletter',
    status: 'scheduled',
    subject: 'AI Table February Updates & Industry Insights',
    recipients: 3200,
    sent: 0,
    opens: 0,
    clicks: 0,
    conversions: 0,
    createdDate: '2024-01-20',
    scheduledDate: '2024-02-01',
    template: 'Newsletter Template',
    tags: ['newsletter', 'monthly']
  },
  {
    id: '4',
    name: 'Re-engagement Campaign',
    type: 'email',
    status: 'completed',
    subject: 'We Miss You! Come Back to AI Table',
    recipients: 800,
    sent: 800,
    opens: 280,
    clicks: 45,
    conversions: 8,
    createdDate: '2024-01-05',
    template: 'Re-engagement Template',
    tags: ['re-engagement', 'inactive']
  }
];

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Welcome Email',
    type: 'welcome',
    description: 'Perfect for onboarding new users with a warm welcome message',
    thumbnail: '📧',
    isActive: true
  },
  {
    id: '2',
    name: 'Product Launch',
    type: 'promotion',
    description: 'Announce new products or features with compelling visuals',
    thumbnail: '🚀',
    isActive: true
  },
  {
    id: '3',
    name: 'Newsletter',
    type: 'newsletter',
    description: 'Regular updates and content for your subscribers',
    thumbnail: '📰',
    isActive: true
  },
  {
    id: '4',
    name: 'Follow-up',
    type: 'follow-up',
    description: 'Nurture leads with personalized follow-up messages',
    thumbnail: '🔄',
    isActive: true
  }
];

type CampaignView = 'campaigns' | 'templates' | 'analytics' | 'automation';

interface EmailCampaignPageProps {
  onCustomerView?: (customerId: string) => void;
}

export function EmailCampaignPage({ onCustomerView }: EmailCampaignPageProps = {}) {
  const [currentView, setCurrentView] = useState<CampaignView>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'scheduled':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'drip':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      case 'newsletter':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      case 'promotional':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const calculateOpenRate = (opens: number, sent: number) => {
    return sent > 0 ? ((opens / sent) * 100).toFixed(1) : '0';
  };

  const calculateClickRate = (clicks: number, sent: number) => {
    return sent > 0 ? ((clicks / sent) * 100).toFixed(1) : '0';
  };

  const calculateConversionRate = (conversions: number, sent: number) => {
    return sent > 0 ? ((conversions / sent) * 100).toFixed(1) : '0';
  };

  const getCustomerIdFromEmail = (email: string): string | null => {
    // Mock mapping of emails to customer IDs
    const emailToCustomerId: { [key: string]: string } = {
      'sarah.johnson@techcorp.com': '1',
      'michael.chen@innovate.io': '2',
      'emily.r@globaltech.com': '3'
    };
    return emailToCustomerId[email] || null;
  };

  const handleViewCustomer = (customerId: string) => {
    if (onCustomerView) {
      onCustomerView(customerId);
    }
  };

  const renderCampaigns = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Email Campaigns</h2>
          <p className="text-muted-foreground">Create and manage your marketing campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
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
              <DropdownMenuItem onClick={() => setSelectedStatus('all')}>All Campaigns</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('draft')}>Draft</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('scheduled')}>Scheduled</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('completed')}>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{mockCampaigns.length}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+3</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                <p className="text-2xl font-bold">
                  {mockCampaigns.reduce((sum, campaign) => sum + campaign.recipients, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+12%</span> growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold">
                  {mockCampaigns.reduce((sum, campaign) => sum + (campaign.sent > 0 ? (campaign.opens / campaign.sent) * 100 : 0), 0) / mockCampaigns.length || 0}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+2.1%</span> vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Click Rate</p>
                <p className="text-2xl font-bold">
                  {mockCampaigns.reduce((sum, campaign) => sum + (campaign.sent > 0 ? (campaign.clicks / campaign.sent) * 100 : 0), 0) / mockCampaigns.length || 0}%
                </p>
              </div>
              <MousePointerClick className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+0.8%</span> vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-4 text-left font-medium">Campaign</th>
                  <th className="p-4 text-left font-medium">Type</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Recipients</th>
                  <th className="p-4 text-left font-medium">Open Rate</th>
                  <th className="p-4 text-left font-medium">Click Rate</th>
                  <th className="p-4 text-left font-medium">Conversions</th>
                  <th className="p-4 text-left font-medium">Created</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockCampaigns
                  .filter(campaign => 
                    selectedStatus === 'all' || campaign.status === selectedStatus
                  )
                  .filter(campaign =>
                    searchQuery === '' || 
                    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{campaign.subject}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={getTypeColor(campaign.type)}>
                          {campaign.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="p-4">{campaign.recipients.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{calculateOpenRate(campaign.opens, campaign.sent)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <span>{calculateClickRate(campaign.clicks, campaign.sent)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.conversions}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {new Date(campaign.createdDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {campaign.status === 'active' && (
                              <DropdownMenuItem>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'paused' && (
                              <DropdownMenuItem>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </DropdownMenuItem>
                            )}
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

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Pre-designed templates for your campaigns</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                    {template.thumbnail}
                  </div>
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {template.type}
                    </Badge>
                  </div>
                </div>
                {template.isActive && (
                  <Badge className="bg-green-100 text-green-700">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Preview
                </Button>
                <Button size="sm" className="flex-1">
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Campaign Analytics</h2>
        <p className="text-muted-foreground">Detailed performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Emails Sent</span>
                <span className="font-medium">3,445</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Opens</span>
                <span className="font-medium">1,628 (47.3%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Clicks</span>
                <span className="font-medium">274 (7.9%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Conversions</span>
                <span className="font-medium">46 (1.3%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCampaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">{campaign.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{calculateOpenRate(campaign.opens, campaign.sent)}% open</p>
                    <p className="text-xs text-muted-foreground">{campaign.sent} sent</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Top Engaging Customers</span>
          </CardTitle>
          <CardDescription>
            Customers with highest engagement rates across campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Sarah Johnson', email: 'sarah.johnson@techcorp.com', company: 'TechCorp Inc.', opens: 12, clicks: 8, conversions: 2 },
              { name: 'Michael Chen', email: 'michael.chen@innovate.io', company: 'Innovate.io', opens: 10, clicks: 6, conversions: 3 },
              { name: 'Emily Rodriguez', email: 'emily.r@globaltech.com', company: 'GlobalTech Solutions', opens: 8, clicks: 4, conversions: 1 }
            ].map((customer) => (
              <div key={customer.email} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&size=64&background=3B82F6&color=fff&bold=true&format=png`} alt={customer.name} />
                    <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.company}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-blue-600">{customer.opens}</p>
                    <p className="text-xs text-muted-foreground">Opens</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-green-600">{customer.clicks}</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-purple-600">{customer.conversions}</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const customerId = getCustomerIdFromEmail(customer.email);
                      if (customerId) handleViewCustomer(customerId);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Customer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case 'campaigns':
        return renderCampaigns();
      case 'templates':
        return renderTemplates();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderCampaigns();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-14 items-center px-6 space-x-6">
          <Button
            variant={currentView === 'campaigns' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('campaigns')}
          >
            <Send className="h-4 w-4 mr-2" />
            Campaigns
          </Button>
          <Button
            variant={currentView === 'templates' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('templates')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            variant={currentView === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('analytics')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant={currentView === 'automation' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('automation')}
          >
            <Target className="h-4 w-4 mr-2" />
            Automation
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