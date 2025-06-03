import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Deal } from '../../types';

interface ActivityChartProps {
  deals: Deal[];
}

export function ActivityChart({ deals }: ActivityChartProps) {
  // Group deals by month for the last 6 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 5);

  const monthlyData = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    const monthName = months[date.getMonth()];
    
    const monthDeals = deals.filter(deal => {
      if (!deal.createdAt) return false;
      const dealDate = new Date(deal.createdAt);
      return dealDate.getMonth() === date.getMonth() && 
             dealDate.getFullYear() === date.getFullYear();
    });

    const wonDeals = monthDeals.filter(deal => deal.status === 'won').length;
    const totalValue = monthDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

    monthlyData.push({
      month: monthName,
      deals: monthDeals.length,
      won: wonDeals,
      value: totalValue,
      conversion: monthDeals.length > 0 ? Math.round((wonDeals / monthDeals.length) * 100) : 0
    });
  }

  // Calculate max values for scaling
  const maxDeals = Math.max(...monthlyData.map(d => d.deals), 1);
  const maxValue = Math.max(...monthlyData.map(d => d.value), 1);

  // Calculate trends
  const currentMonthDeals = monthlyData[monthlyData.length - 1]?.deals || 0;
  const previousMonthDeals = monthlyData[monthlyData.length - 2]?.deals || 0;
  const dealTrend = previousMonthDeals > 0 
    ? Math.round(((currentMonthDeals - previousMonthDeals) / previousMonthDeals) * 100)
    : 0;

  const currentMonthValue = monthlyData[monthlyData.length - 1]?.value || 0;
  const previousMonthValue = monthlyData[monthlyData.length - 2]?.value || 0;
  const valueTrend = previousMonthValue > 0 
    ? Math.round(((currentMonthValue - previousMonthValue) / previousMonthValue) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Deal Activity</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Last 6 months performance
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className={`h-4 w-4 ${dealTrend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className={dealTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                {dealTrend >= 0 ? '+' : ''}{dealTrend}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Simple bar chart representation */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Deals Created</span>
              <span>Deal Value</span>
            </div>
            
            {monthlyData.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{data.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-muted-foreground">{data.deals} deals</span>
                    <span className="font-medium">${data.value.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Deal count bar */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(data.deals / maxDeals) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{data.deals}</span>
                </div>
                
                {/* Deal value bar */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(data.value / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{data.conversion}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {monthlyData.reduce((sum, d) => sum + d.deals, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Deals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${monthlyData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Value</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 