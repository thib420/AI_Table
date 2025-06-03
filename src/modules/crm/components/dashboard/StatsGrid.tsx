import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Building2, DollarSign, Calendar, Target } from 'lucide-react';
import { Contact, Deal, Company } from '../../types';

interface StatsGridProps {
  contacts: Contact[];
  deals: Deal[];
  companies: Company[];
}

export function StatsGrid({ contacts, deals, companies }: StatsGridProps) {
  // Calculate statistics
  const totalContacts = contacts.length;
  const totalDeals = deals.length;
  const totalCompanies = companies.length;
  
  // Calculate deal values
  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const avgDealValue = totalDeals > 0 ? totalDealValue / totalDeals : 0;
  
  // Calculate active deals (assuming status 'active' or 'in_progress')
  const activeDeals = deals.filter(deal => 
    deal.status === 'active' || deal.status === 'in_progress' || deal.status === 'negotiation'
  ).length;
  
  // Calculate conversion rate (won deals / total deals)
  const wonDeals = deals.filter(deal => deal.status === 'won').length;
  const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

  // Calculate recent activity (contacts contacted in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentActivity = contacts.filter(contact => {
    const lastContactDate = new Date(contact.lastContact);
    return lastContactDate >= thirtyDaysAgo;
  }).length;

  const stats = [
    {
      title: 'Total Contacts',
      value: totalContacts.toLocaleString(),
      icon: Users,
      description: 'Active customer relationships',
      trend: recentActivity > 0 ? `+${recentActivity} this month` : 'No recent activity',
      color: 'text-blue-600'
    },
    {
      title: 'Active Deals',
      value: activeDeals.toLocaleString(),
      icon: Target,
      description: 'Deals in progress',
      trend: `${Math.round(conversionRate)}% conversion rate`,
      color: 'text-green-600'
    },
    {
      title: 'Total Pipeline',
      value: `$${totalDealValue.toLocaleString()}`,
      icon: DollarSign,
      description: 'Combined deal value',
      trend: `$${Math.round(avgDealValue).toLocaleString()} avg deal`,
      color: 'text-emerald-600'
    },
    {
      title: 'Companies',
      value: totalCompanies.toLocaleString(),
      icon: Building2,
      description: 'Business relationships',
      trend: 'Across all sectors',
      color: 'text-purple-600'
    },
    {
      title: 'Recent Activity',
      value: recentActivity.toLocaleString(),
      icon: Calendar,
      description: 'Contacts this month',
      trend: 'Last 30 days',
      color: 'text-orange-600'
    },
    {
      title: 'Growth Rate',
      value: `${Math.round(conversionRate)}%`,
      icon: TrendingUp,
      description: 'Deal conversion',
      trend: `${wonDeals} deals won`,
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              <p className={`text-xs mt-2 ${stat.color}`}>
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 