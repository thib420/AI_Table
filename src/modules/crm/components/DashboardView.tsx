import React from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Target,
  Activity
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
            {deals.filter(d => !d.stage.startsWith('closed')).map((deal) => (
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
} 