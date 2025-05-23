"use client";

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  FileText, 
  ShoppingCart, 
  Target, 
  MessageSquare, 
  Activity, 
  Edit, 
  Star, 
  ExternalLink,
  Download,
  Send,
  Clock,
  DollarSign,
  Paperclip,
  Video,
  Users,
  TrendingUp,
  Eye,
  MoreHorizontal,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ContactDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  dealValue: number;
  lastContact: string;
  tags: string[];
  source: string;
  createdDate: string;
  totalRevenue: number;
  lifetimeValue: number;
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'deal' | 'order' | 'document' | 'campaign' | 'note';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  metadata?: {
    value?: number;
    status?: string;
    attachments?: number;
    participants?: string[];
  };
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
  status: 'open' | 'won' | 'lost';
}

interface Order {
  id: string;
  orderNumber: string;
  products: string[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'xlsx' | 'ppt' | 'other';
  size: string;
  uploadDate: string;
  sharedBy: string;
}

interface EmailSummary {
  totalEmails: number;
  sentEmails: number;
  receivedEmails: number;
  lastEmailDate: string;
  responseRate: number;
}

// Mock data
const mockContact: ContactDetail = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@techcorp.com',
  phone: '+1 (555) 123-4567',
  company: 'TechCorp Inc.',
  position: 'VP of Engineering',
  location: 'San Francisco, CA',
  status: 'customer',
  dealValue: 150000,
  lastContact: '2024-01-20',
  tags: ['enterprise', 'technical', 'decision-maker'],
  source: 'LinkedIn',
  createdDate: '2023-08-15',
  totalRevenue: 450000,
  lifetimeValue: 750000,
  socialProfiles: {
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    website: 'https://techcorp.com'
  }
};

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'email',
    title: 'Partnership Proposal Discussion',
    description: 'Sent partnership proposal document and discussed integration timeline',
    timestamp: '2024-01-20T10:30:00Z',
    user: 'John Doe',
    metadata: { attachments: 2 }
  },
  {
    id: '2',
    type: 'meeting',
    title: 'Product Demo Call',
    description: 'Conducted 45-minute product demonstration with technical team',
    timestamp: '2024-01-18T14:00:00Z',
    user: 'John Doe',
    metadata: { participants: ['Sarah Johnson', 'Mike Chen', 'Alex Rodriguez'] }
  },
  {
    id: '3',
    type: 'deal',
    title: 'Enterprise License Deal Updated',
    description: 'Deal stage moved to negotiation, increased probability to 85%',
    timestamp: '2024-01-17T16:20:00Z',
    user: 'System',
    metadata: { value: 150000, status: 'negotiation' }
  },
  {
    id: '4',
    type: 'order',
    title: 'Order #TC-2024-001 Placed',
    description: 'Annual license renewal with additional features',
    timestamp: '2024-01-15T11:45:00Z',
    user: 'Sarah Johnson',
    metadata: { value: 75000, status: 'processing' }
  },
  {
    id: '5',
    type: 'call',
    title: 'Follow-up Call',
    description: 'Discussed implementation timeline and resource requirements',
    timestamp: '2024-01-12T09:15:00Z',
    user: 'John Doe'
  },
  {
    id: '6',
    type: 'document',
    title: 'Technical Specifications Shared',
    description: 'Uploaded API documentation and integration guide',
    timestamp: '2024-01-10T13:30:00Z',
    user: 'Tech Team',
    metadata: { attachments: 3 }
  },
  {
    id: '7',
    type: 'campaign',
    title: 'Product Launch Campaign',
    description: 'Opened Q1 product launch email, clicked pricing link',
    timestamp: '2024-01-08T08:22:00Z',
    user: 'Marketing System'
  }
];

const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'Enterprise License Renewal',
    value: 150000,
    stage: 'negotiation',
    probability: 85,
    closeDate: '2024-02-15',
    status: 'open'
  },
  {
    id: '2',
    title: 'Additional Modules Purchase',
    value: 50000,
    stage: 'proposal',
    probability: 60,
    closeDate: '2024-03-01',
    status: 'open'
  },
  {
    id: '3',
    title: 'Initial Platform License',
    value: 75000,
    stage: 'closed-won',
    probability: 100,
    closeDate: '2023-12-01',
    status: 'won'
  }
];

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'TC-2024-001',
    products: ['Enterprise License', 'Premium Support'],
    totalAmount: 75000,
    status: 'delivered',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-20'
  },
  {
    id: '2',
    orderNumber: 'TC-2023-047',
    products: ['Basic License', 'Standard Support'],
    totalAmount: 45000,
    status: 'delivered',
    orderDate: '2023-12-01',
    deliveryDate: '2023-12-05'
  }
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'API Integration Guide.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2024-01-10',
    sharedBy: 'Tech Team'
  },
  {
    id: '2',
    name: 'Partnership Agreement.docx',
    type: 'doc',
    size: '156 KB',
    uploadDate: '2024-01-05',
    sharedBy: 'Legal Team'
  },
  {
    id: '3',
    name: 'Product Specifications.xlsx',
    type: 'xlsx',
    size: '1.8 MB',
    uploadDate: '2023-12-20',
    sharedBy: 'Product Team'
  }
];

const mockEmailSummary: EmailSummary = {
  totalEmails: 47,
  sentEmails: 23,
  receivedEmails: 24,
  lastEmailDate: '2024-01-20',
  responseRate: 85
};

interface ContactDetailPageProps {
  contactId: string;
  onBack: () => void;
}

export function ContactDetailPage({ contactId, onBack }: ContactDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'deals' | 'orders' | 'documents' | 'emails'>('overview');

  const generateProfilePicture = (name: string) => {
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=${backgroundColor}&color=fff&bold=true&format=png`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'call': return Phone;
      case 'meeting': return Video;
      case 'deal': return Target;
      case 'order': return ShoppingCart;
      case 'document': return FileText;
      case 'campaign': return Send;
      case 'note': return MessageSquare;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'call': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'meeting': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'deal': return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
      case 'order': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900';
      case 'document': return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
      case 'campaign': return 'text-pink-600 bg-pink-100 dark:bg-pink-900';
      case 'note': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'prospect': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'customer': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 168) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${mockContact.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lifetime Value</p>
                <p className="text-2xl font-bold">${mockContact.lifetimeValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{mockDeals.filter(d => d.status === 'open').length}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Response Rate</p>
                <p className="text-2xl font-bold">{mockEmailSummary.responseRate}%</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activity</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('activities')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActivities.slice(0, 5).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <span className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.metadata?.value && (
                        <p className="text-sm font-medium text-green-600">${activity.metadata.value.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{mockContact.company}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{mockContact.position}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{mockContact.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Customer since {new Date(mockContact.createdDate).toLocaleDateString()}</span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Social Profiles</h4>
                {mockContact.socialProfiles.linkedin && (
                  <a href={mockContact.socialProfiles.linkedin} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800">
                    <ExternalLink className="h-3 w-3" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {mockContact.socialProfiles.website && (
                  <a href={mockContact.socialProfiles.website} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800">
                    <ExternalLink className="h-3 w-3" />
                    <span>Company Website</span>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Schedule Call
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Book Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderActivities = () => (
    <div className="space-y-4">
      {mockActivities.map((activity) => {
        const Icon = getActivityIcon(activity.type);
        return (
          <Card key={activity.id}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full ${getActivityColor(activity.type)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{activity.title}</h3>
                    <span className="text-sm text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                  </div>
                  <p className="text-muted-foreground mb-2">{activity.description}</p>
                  
                  {activity.metadata && (
                    <div className="flex items-center space-x-4 text-sm">
                      {activity.metadata.value && (
                        <span className="font-medium text-green-600">
                          ${activity.metadata.value.toLocaleString()}
                        </span>
                      )}
                      {activity.metadata.status && (
                        <Badge variant="outline">{activity.metadata.status}</Badge>
                      )}
                      {activity.metadata.attachments && (
                        <span className="flex items-center space-x-1 text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span>{activity.metadata.attachments} attachments</span>
                        </span>
                      )}
                      {activity.metadata.participants && (
                        <span className="flex items-center space-x-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{activity.metadata.participants.length} participants</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 text-sm text-muted-foreground">
                    by {activity.user}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderDeals = () => (
    <div className="space-y-4">
      {mockDeals.map((deal) => (
        <Card key={deal.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">{deal.title}</h3>
                <p className="text-sm text-muted-foreground">Close date: {new Date(deal.closeDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${deal.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{deal.probability}% probability</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge className={deal.status === 'won' ? 'bg-green-100 text-green-700' : deal.status === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                {deal.stage}
              </Badge>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      {mockOrders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Order #{order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  Ordered on {new Date(order.orderDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${order.totalAmount.toLocaleString()}</p>
                <Badge className={getOrderStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Products:</p>
                <p className="text-sm text-muted-foreground">{order.products.join(', ')}</p>
              </div>
              
              {order.deliveryDate && (
                <div>
                  <p className="text-sm font-medium">Delivered:</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4">
      {mockDocuments.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">{doc.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>Shared by {doc.sharedBy}</span>
                  <span>•</span>
                  <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmails = () => (
    <div className="space-y-6">
      {/* Email Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockEmailSummary.totalEmails}</p>
              <p className="text-sm text-muted-foreground">Total Emails</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockEmailSummary.sentEmails}</p>
              <p className="text-sm text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockEmailSummary.receivedEmails}</p>
              <p className="text-sm text-muted-foreground">Received</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockEmailSummary.responseRate}%</p>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Emails */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Conversations</CardTitle>
          <CardDescription>
            Last email: {new Date(mockEmailSummary.lastEmailDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivities.filter(a => a.type === 'email').map((email) => (
              <div key={email.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{email.title}</h4>
                    <span className="text-sm text-muted-foreground">{formatTimestamp(email.timestamp)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{email.description}</p>
                  {email.metadata?.attachments && (
                    <div className="mt-2 flex items-center space-x-1 text-sm text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      <span>{email.metadata.attachments} attachments</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline">
              View All Email History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'activities': return renderActivities();
      case 'deals': return renderDeals();
      case 'orders': return renderOrders();
      case 'documents': return renderDocuments();
      case 'emails': return renderEmails();
      default: return renderOverview();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-16 items-center px-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
          
          <div className="flex items-center space-x-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={generateProfilePicture(mockContact.name)} alt={mockContact.name} />
              <AvatarFallback>{mockContact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-xl font-semibold">{mockContact.name}</h1>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-muted-foreground">{mockContact.position} at {mockContact.company}</p>
                <Badge className={getStatusColor(mockContact.status)}>
                  {mockContact.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" className="mr-2">
              <Edit className="h-4 w-4 mr-2" />
              Edit Contact
            </Button>
            <Button variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Add to Favorites
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b bg-background">
        <div className="flex h-12 items-center px-6 space-x-6">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'activities', label: 'Activities', icon: Activity },
            { id: 'deals', label: 'Deals', icon: Target },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'emails', label: 'Emails', icon: Mail }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
} 