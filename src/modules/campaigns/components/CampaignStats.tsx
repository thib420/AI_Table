"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Users, Eye, MousePointerClick } from 'lucide-react';
import { CampaignStatsProps } from '../types';

export function CampaignStats({ campaigns }: CampaignStatsProps) {
  const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.recipients, 0);
  const avgOpenRate = campaigns.length > 0 
    ? (campaigns.reduce((sum, campaign) => sum + (campaign.sent > 0 ? (campaign.opens / campaign.sent) * 100 : 0), 0) / campaigns.length).toFixed(1)
    : '0.0';
  const avgClickRate = campaigns.length > 0
    ? (campaigns.reduce((sum, campaign) => sum + (campaign.sent > 0 ? (campaign.clicks / campaign.sent) * 100 : 0), 0) / campaigns.length).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
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
              <p className="text-2xl font-bold">{totalRecipients.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{avgOpenRate}%</p>
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
              <p className="text-2xl font-bold">{avgClickRate}%</p>
            </div>
            <MousePointerClick className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600">+0.8%</span> vs last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 