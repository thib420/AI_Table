"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { CreateCampaignDialog } from './CreateCampaignDialog';
import { Campaign, Template, CampaignView, EmailCampaignPageProps, CampaignData } from '../types';
import { CampaignStats } from './CampaignStats';
import { CampaignFilters } from './CampaignFilters';
import { CampaignsList } from './CampaignsList';

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
    tags: ['product', 'launch', 'q1'],
    description: '',
    audience: [],
    startDate: '2024-01-15',
    timezone: 'UTC',
    emailSequence: []
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
    tags: ['welcome', 'onboarding'],
    description: '',
    audience: [],
    startDate: '2024-01-10',
    timezone: 'UTC',
    emailSequence: []
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
    tags: ['newsletter', 'monthly'],
    description: '',
    audience: [],
    startDate: '2024-02-01',
    timezone: 'UTC',
    emailSequence: []
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
    tags: ['re-engagement', 'inactive'],
    description: '',
    audience: [],
    startDate: '2024-01-05',
    timezone: 'UTC',
    emailSequence: []
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

export function EmailCampaignPage({ onCustomerView }: EmailCampaignPageProps = {}) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<CampaignView>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  const handleCampaignCreate = (campaignData: CampaignData) => {
    console.log('Creating campaign:', campaignData);
    // Here you would typically send the data to your backend
    // For now, we'll just log it and close the dialog
    setShowCreateDialog(false);
  };

  const renderCampaigns = () => (
    <div className="space-y-6">
      <CampaignFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onNewCampaign={() => setShowCreateDialog(true)}
      />

      <CampaignStats campaigns={mockCampaigns} />

      <CampaignsList
        campaigns={mockCampaigns}
        searchQuery={searchQuery}
        selectedStatus={selectedStatus}
        onViewCustomer={onCustomerView}
      />
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
          <Mail className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTemplates.map((template) => (
          <div key={template.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  {template.thumbnail}
                </div>
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className="text-xs border rounded px-2 py-1">{template.type}</span>
                </div>
              </div>
              {template.isActive && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Active</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">Preview</Button>
              <Button size="sm" className="flex-1">Use Template</Button>
            </div>
          </div>
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
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
        <p className="text-muted-foreground">Analytics components coming soon...</p>
      </div>
    </div>
  );

  const renderSequenceBuilder = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Sequence Builder</h2>
          <p className="text-muted-foreground">Create and manage automated email sequences</p>
        </div>
        <Button onClick={() => router.push('/campaigns/sequence-builder')}>
          <Zap className="h-4 w-4 mr-2" />
          Create New Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer" 
              onClick={() => router.push('/campaigns/sequence-builder?name=Welcome%20Series')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-4 mx-auto">
              👋
            </div>
            <h3 className="font-semibold mb-2">Welcome Series</h3>
            <p className="text-sm text-muted-foreground">Create an onboarding sequence for new subscribers</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
              onClick={() => router.push('/campaigns/sequence-builder?name=Product%20Launch')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-4 mx-auto">
              🚀
            </div>
            <h3 className="font-semibold mb-2">Product Launch</h3>
            <p className="text-sm text-muted-foreground">Build excitement with a multi-email product launch</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
              onClick={() => router.push('/campaigns/sequence-builder?name=Nurture%20Campaign')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-4 mx-auto">
              🌱
            </div>
            <h3 className="font-semibold mb-2">Nurture Campaign</h3>
            <p className="text-sm text-muted-foreground">Educate and engage leads over time</p>
          </CardContent>
        </Card>
      </div>

      {/* Existing Sequences (placeholder) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Sequences</h3>
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No sequences created yet</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => router.push('/campaigns/sequence-builder')}
          >
            Create Your First Sequence
          </Button>
        </div>
      </div>
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
      case 'sequence':
        return renderSequenceBuilder();
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
          <Button
            variant={currentView === 'sequence' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('sequence')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Sequence
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </div>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCampaignCreate={handleCampaignCreate}
      />
    </div>
  );
} 