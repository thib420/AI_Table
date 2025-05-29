"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Calendar,
  Users,
  Mail,
  Home,
  ChevronRight
} from 'lucide-react';
import { EmailSequenceBuilder } from './EmailSequenceBuilder';
import { EmailSequenceStep, CampaignData } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CampaignDetails {
  id?: string;
  name: string;
  description: string;
  type: string;
  audienceCount: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
}

export function EmailSequenceBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailSequence, setEmailSequence] = useState<EmailSequenceStep[]>([]);
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({
    name: 'New Campaign',
    description: '',
    type: 'drip',
    audienceCount: 0,
    status: 'draft'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load campaign data if editing existing campaign
  useEffect(() => {
    const campaignId = searchParams.get('campaignId');
    const campaignName = searchParams.get('name');
    
    if (campaignId) {
      // Load existing campaign data
      // In real implementation, fetch from API:
      // const campaign = await campaignService.getCampaign(campaignId);
      setCampaignDetails(prev => ({
        ...prev,
        id: campaignId,
        name: campaignName || 'Existing Campaign'
      }));
    } else if (campaignName) {
      // New campaign with pre-filled name
      setCampaignDetails(prev => ({
        ...prev,
        name: decodeURIComponent(campaignName)
      }));
    }
  }, [searchParams]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save campaign data
      const campaignData: CampaignData = {
        name: campaignDetails.name,
        description: campaignDetails.description,
        type: campaignDetails.type as 'email' | 'drip' | 'newsletter' | 'promotional',
        emailSequence,
        audience: [], // Will be set from audience selection
        startDate: new Date().toISOString().split('T')[0],
        timezone: 'UTC',
        tags: []
      };

      // In real implementation:
      // await campaignService.saveCampaign(campaignData);
      
      console.log('Saving campaign:', campaignData);
      
      // Show success message
      // toast.success('Campaign saved successfully!');
    } catch (error) {
      console.error('Error saving campaign:', error);
      // toast.error('Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunch = () => {
    // Navigate to launch/schedule page
    router.push(`/campaigns/launch?campaignId=${campaignDetails.id || 'new'}`);
  };

  const handlePreview = () => {
    // Open preview mode
    console.log('Preview campaign');
  };

  const handleGoBack = () => {
    router.push('/campaigns');
  };

  const getTotalSequenceDuration = () => {
    let totalHours = 0;
    emailSequence.forEach(step => {
      totalHours += step.delayDays * 24 + step.delayHours;
    });
    
    if (totalHours === 0) return 'Immediate';
    if (totalHours < 24) return `${totalHours} hours`;
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (hours === 0) return `${days} day${days !== 1 ? 's' : ''}`;
    return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          {/* Navigation */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Home className="h-4 w-4" />
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/campaigns')}
            >
              Campaigns
            </Button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Email Sequence Builder</span>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="space-y-1">
                {isEditing ? (
                  <Input
                    value={campaignDetails.name}
                    onChange={(e) => setCampaignDetails(prev => ({ ...prev, name: e.target.value }))}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditing(false);
                    }}
                    className="text-2xl font-bold h-auto border-0 px-0 focus-visible:ring-0"
                    autoFocus
                  />
                ) : (
                  <h1 
                    className="text-2xl font-bold cursor-pointer hover:text-muted-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    {campaignDetails.name}
                  </h1>
                )}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{emailSequence.length} email{emailSequence.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{getTotalSequenceDuration()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{campaignDetails.audienceCount} recipients</span>
                  </div>
                  <Badge variant={campaignDetails.status === 'draft' ? 'secondary' : 'default'}>
                    {campaignDetails.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Options
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/campaigns/audience')}>
                    <Users className="h-4 w-4 mr-2" />
                    Edit Audience
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/campaigns/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Campaign Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Duplicate Campaign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={handleLaunch}>
                <Send className="h-4 w-4 mr-2" />
                Launch Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Campaign Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Email Sequence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {emailSequence.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailSequence.filter(s => s.isActive).length} active emails
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {getTotalSequenceDuration()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total sequence length
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {campaignDetails.audienceCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs text-blue-600"
                    onClick={() => router.push('/campaigns/audience')}
                  >
                    Edit audience →
                  </Button>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Email Sequence Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Email Sequence</CardTitle>
              <CardDescription>
                Build your automated email sequence with personalized timing and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailSequenceBuilder
                emailSequence={emailSequence}
                onSequenceChange={setEmailSequence}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 