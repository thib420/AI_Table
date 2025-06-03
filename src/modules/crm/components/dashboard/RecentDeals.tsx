import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Handshake, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Deal } from '../../types';

interface RecentDealsProps {
  deals: Deal[];
}

export function RecentDeals({ deals }: RecentDealsProps) {
  // Sort deals by creation date (most recent first) and take top 5
  const recentDeals = deals
    .filter(deal => deal.createdAt) // Only deals with creation date
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'negotiation': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'won': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'lost': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'paused': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <TrendingUp className="h-3 w-3" />;
      case 'negotiation':
        return <Handshake className="h-3 w-3" />;
      case 'in_progress':
      case 'active':
        return <Clock className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Handshake className="h-5 w-5" />
          <span>Recent Deals</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest deal activity and progress
        </p>
      </CardHeader>
      <CardContent>
        {recentDeals.length === 0 ? (
          <div className="text-center py-8">
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Recent Deals</h3>
            <p className="text-sm text-muted-foreground">
              Deal activity will appear here once you start creating deals.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentDeals.map((deal, index) => (
              <div key={deal.id || index} className="flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${deal.title || 'Deal'}`} />
                  <AvatarFallback>
                    {getInitials(deal.title || deal.company || 'Deal')}
                  </AvatarFallback>
                </Avatar>

                {/* Deal Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {deal.title || `Deal with ${deal.company || 'Unknown'}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(deal.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(deal.status)}
                          <span className="capitalize">{deal.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {deal.company || 'No company specified'}
                    </p>
                    <p className="text-sm font-medium">
                      ${(deal.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {deal.createdAt ? formatTimeAgo(deal.createdAt) : 'Unknown date'}
                    </p>
                    {deal.closeDate && (
                      <p className="text-xs text-muted-foreground">
                        Close: {new Date(deal.closeDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* View All link */}
            <div className="pt-4 border-t">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors">
                View All Deals →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 