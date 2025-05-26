import React from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Target,
  Activity,
  Mail,
  Calendar,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { graphCRMService } from '../services/GraphCRMService';
import { Contact, Deal, Company } from '../types';
import { getStageColor } from '../utils/helpers';

export function DashboardView() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [contactsData, dealsData, companiesData] = await Promise.all([
          graphCRMService.getAllContacts(),
          graphCRMService.getDeals(),
          graphCRMService.getCompanies()
        ]);
        
        setContacts(contactsData);
        setDeals(dealsData);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate recent activities from real data
  const getRecentActivities = () => {
    const activities = [];
    
    // Add recent deals as activities
    deals.slice(0, 2).forEach(deal => {
      activities.push({
        id: `deal-${deal.id}`,
        type: 'deal',
        icon: Target,
        color: 'bg-orange-500',
        message: `Deal "${deal.title}" created`,
        time: `${deal.company}`,
        timestamp: deal.createdDate
      });
    });

    // Add recent contacts as activities
    contacts.slice(0, 2).forEach(contact => {
      activities.push({
        id: `contact-${contact.id}`,
        type: 'contact',
        icon: UserPlus,
        color: 'bg-blue-500',
        message: `New contact added: ${contact.name}`,
        time: `${contact.company}`,
        timestamp: contact.lastContact
      });
    });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 3);
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentActivities = getRecentActivities();

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">Live data</span> from Microsoft Graph
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{deals.filter(d => !d.stage.startsWith('closed')).length}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">Derived</span> from emails & meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">
                  ${deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">Estimated</span> from interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">Extracted</span> from contacts
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
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time} • {formatActivityTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity will appear here as you interact with contacts and create deals
                </p>
              </div>
            )}
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
            {deals.filter(d => !d.stage.startsWith('closed')).length > 0 ? (
              deals.filter(d => !d.stage.startsWith('closed')).map((deal) => (
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
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No active deals</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deals are automatically created from high-priority emails and meetings
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 