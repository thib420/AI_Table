"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  Mail,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Users,
  Settings,
  Send,
  Eye,
  Edit,
  Copy,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { EmailSequenceStep, CampaignData, CreateCampaignDialogProps } from '../types';
import { ContactSelector } from './ContactSelector';
import { EmailSequenceBuilder } from './EmailSequenceBuilder';

// Note: For real integration, import these from the CRM module:
// import { graphCRMService } from '@/modules/crm/services/GraphCRMService';
// import { COMMON_TAGS } from '@/modules/crm/components/EditContactDialog';

const defaultEmailStep: Omit<EmailSequenceStep, 'id'> = {
  name: 'Untitled Step',
  subject: '',
  content: '',
  delayDays: 0,
  delayHours: 0,
  isActive: true,
};

export function CreateCampaignDialog({ open, onOpenChange, onCampaignCreate }: CreateCampaignDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    type: 'email',
    audience: [],
    startDate: new Date().toISOString().split('T')[0],
    timezone: 'UTC',
    emailSequence: [],
    tags: []
  });

  const steps = [
    { id: 'basic', title: 'Campaign Details', description: 'Basic information about your campaign' },
    { id: 'audience', title: 'Target Audience', description: 'Select contacts and recipients' },
    { id: 'sequence', title: 'Email Sequence', description: 'Create your email sequence and timing' },
    { id: 'schedule', title: 'Schedule & Launch', description: 'Set schedule and launch options' },
  ];

  const addEmailStep = () => {
    const newStep: EmailSequenceStep = {
      ...defaultEmailStep,
      id: `step-${Date.now()}`,
      name: `Email ${campaignData.emailSequence.length + 1}`,
    };
    setCampaignData(prev => ({
      ...prev,
      emailSequence: [...prev.emailSequence, newStep]
    }));
  };

  const updateEmailStep = (stepId: string, updates: Partial<EmailSequenceStep>) => {
    setCampaignData(prev => ({
      ...prev,
      emailSequence: prev.emailSequence.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  };

  const removeEmailStep = (stepId: string) => {
    setCampaignData(prev => ({
      ...prev,
      emailSequence: prev.emailSequence.filter(step => step.id !== stepId)
    }));
  };

  const moveEmailStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = campaignData.emailSequence.findIndex(step => step.id === stepId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= campaignData.emailSequence.length) return;

    const newSequence = [...campaignData.emailSequence];
    [newSequence[currentIndex], newSequence[newIndex]] = [newSequence[newIndex], newSequence[currentIndex]];

    setCampaignData(prev => ({ ...prev, emailSequence: newSequence }));
  };

  const getStepDelay = (step: EmailSequenceStep, index: number) => {
    if (index === 0) return 'Immediately';
    const totalHours = step.delayDays * 24 + step.delayHours;
    if (totalHours === 0) return 'Immediately';
    if (totalHours < 24) return `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
    if (step.delayHours === 0) return `${step.delayDays} day${step.delayDays !== 1 ? 's' : ''}`;
    return `${step.delayDays} day${step.delayDays !== 1 ? 's' : ''} ${step.delayHours} hour${step.delayHours !== 1 ? 's' : ''}`;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    if (onCampaignCreate) {
      onCampaignCreate(campaignData);
    }
    onOpenChange(false);
    // Reset form
    setCampaignData({
      name: '',
      description: '',
      type: 'email',
      audience: [],
      startDate: new Date().toISOString().split('T')[0],
      timezone: 'UTC',
      emailSequence: [],
      tags: []
    });
    setCurrentStep(0);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderBasicDetails = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="campaign-name">Campaign Name</Label>
        <Input
          id="campaign-name"
          placeholder="Enter campaign name..."
          value={campaignData.name}
          onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-description">Description</Label>
        <Textarea
          id="campaign-description"
          placeholder="Brief description of your campaign..."
          value={campaignData.description}
          onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-type">Campaign Type</Label>
        <Select value={campaignData.type} onValueChange={(value: any) => setCampaignData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select campaign type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Single Email</SelectItem>
            <SelectItem value="drip">Drip Sequence</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="promotional">Promotional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-tags">Tags (comma-separated)</Label>
        <Input
          id="campaign-tags"
          placeholder="marketing, product-launch, q1..."
          value={campaignData.tags.join(', ')}
          onChange={(e) => setCampaignData(prev => ({ 
            ...prev, 
            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
          }))}
        />
      </div>
    </div>
  );

  const renderAudienceSelection = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Select Your Audience</h3>
        <p className="text-muted-foreground mb-4">Choose contacts and lists for this campaign</p>
        <Button variant="outline" onClick={() => setShowContactSelector(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Select Contacts
        </Button>
      </div>
      
      {campaignData.audience.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Selected Audience ({campaignData.audience.length})</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowContactSelector(true)}
            >
              Edit Selection
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {campaignData.audience.map((contactId, index) => (
              <Badge key={index} variant="secondary">
                Contact {contactId}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <ContactSelector
        open={showContactSelector}
        onOpenChange={setShowContactSelector}
        selectedContacts={campaignData.audience}
        onContactsChange={(contacts) => setCampaignData(prev => ({ ...prev, audience: contacts }))}
        contacts={[]}
        onLoadContacts={async () => {
          // Example integration with CRM service:
          // return await graphCRMService.getAllContacts();
          console.log('Loading all contacts...');
          return [];
        }}
        onLoadContactsByTag={async (tag: string) => {
          // Example integration with CRM service:
          // return await graphCRMService.getContactsByTag(tag);
          console.log(`Loading contacts with tag: ${tag}`);
          return [];
        }}
      />
    </div>
  );

  const renderEmailSequence = () => (
    <EmailSequenceBuilder
      emailSequence={campaignData.emailSequence}
      onSequenceChange={(sequence) => setCampaignData(prev => ({ ...prev, emailSequence: sequence }))}
    />
  );

  const renderScheduleAndLaunch = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={campaignData.startDate}
            onChange={(e) => setCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={campaignData.timezone} onValueChange={(value) => setCampaignData(prev => ({ ...prev, timezone: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              <SelectItem value="Europe/London">London</SelectItem>
              <SelectItem value="Europe/Paris">Paris</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-muted/50">
        <h4 className="font-medium mb-3">Campaign Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Campaign Name:</span>
            <span className="font-medium">{campaignData.name || 'Untitled Campaign'}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium capitalize">{campaignData.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Email Sequence:</span>
            <span className="font-medium">{campaignData.emailSequence.length} email{campaignData.emailSequence.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>Recipients:</span>
            <span className="font-medium">{campaignData.audience.length} contact{campaignData.audience.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>Start Date:</span>
            <span className="font-medium">{new Date(campaignData.startDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicDetails();
      case 1:
        return renderAudienceSelection();
      case 2:
        return renderEmailSequence();
      case 3:
        return renderScheduleAndLaunch();
      default:
        return renderBasicDetails();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up your email campaign with personalized sequences and scheduling
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Navigation */}
        <div className="flex space-x-1 mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 text-center p-2 rounded-lg text-sm transition-colors ${
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStep
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <div className="font-medium">{step.title}</div>
              <div className="text-xs opacity-75">{step.description}</div>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="min-h-[500px]">
          {renderCurrentStep()}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleCreate}>
                <Send className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 