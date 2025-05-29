"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, Plus } from 'lucide-react';
import { CampaignFiltersProps } from '../types';

export function CampaignFilters({ 
  searchQuery, 
  onSearchChange, 
  selectedStatus, 
  onStatusChange, 
  onNewCampaign 
}: CampaignFiltersProps) {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
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
            <DropdownMenuItem onClick={() => onStatusChange('all')}>All Campaigns</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('active')}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('draft')}>Draft</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('scheduled')}>Scheduled</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('completed')}>Completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={onNewCampaign}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>
    </div>
  );
} 