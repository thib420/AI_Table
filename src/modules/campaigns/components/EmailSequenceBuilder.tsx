"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Mail,
  Plus,
  Trash2,
  Eye,
  Edit,
  Copy,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Clock,
  Send,
  FileText,
  Zap,
  Settings,
  TestTube,
  Users,
  BarChart3
} from 'lucide-react';
import { EmailSequenceStep } from '../types';

interface EmailSequenceBuilderProps {
  emailSequence: EmailSequenceStep[];
  onSequenceChange: (sequence: EmailSequenceStep[]) => void;
  className?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'welcome' | 'follow-up' | 'nurture' | 'promotional' | 'reminder';
  description: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome-1',
    name: 'Welcome Email',
    subject: 'Welcome to {{company_name}}! 🎉',
    content: `Hi {{first_name}},

Welcome to {{company_name}}! We're thrilled to have you on board.

Here's what you can expect:
• Getting started guide
• Access to our resources
• Dedicated support

Best regards,
{{sender_name}}`,
    category: 'welcome',
    description: 'Perfect first email for new subscribers'
  },
  {
    id: 'follow-up-1',
    name: 'Follow-up Check-in',
    subject: 'How are things going, {{first_name}}?',
    content: `Hi {{first_name}},

I wanted to check in and see how you're finding {{product_name}}.

Have you had a chance to explore the key features?

If you have any questions, I'm here to help!

Best,
{{sender_name}}`,
    category: 'follow-up',
    description: 'Great for checking in after initial contact'
  },
  {
    id: 'nurture-1',
    name: 'Educational Content',
    subject: '5 Tips to Get the Most from {{product_name}}',
    content: `Hi {{first_name}},

Here are 5 proven tips to maximize your results:

1. Set up your profile completely
2. Connect with relevant contacts
3. Use automation features
4. Track your metrics
5. Join our community

Let me know if you need help with any of these!

{{sender_name}}`,
    category: 'nurture',
    description: 'Educational content to build trust'
  }
];

const DELAY_PRESETS = [
  { label: 'Immediately', days: 0, hours: 0 },
  { label: '1 hour', days: 0, hours: 1 },
  { label: '3 hours', days: 0, hours: 3 },
  { label: '1 day', days: 1, hours: 0 },
  { label: '3 days', days: 3, hours: 0 },
  { label: '1 week', days: 7, hours: 0 },
  { label: '2 weeks', days: 14, hours: 0 },
];

const defaultEmailStep: Omit<EmailSequenceStep, 'id'> = {
  name: 'Untitled Step',
  subject: '',
  content: '',
  delayDays: 0,
  delayHours: 0,
  isActive: true,
};

export function EmailSequenceBuilder({ emailSequence, onSequenceChange, className }: EmailSequenceBuilderProps) {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [previewStep, setPreviewStep] = useState<EmailSequenceStep | null>(null);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const addEmailStep = (template?: EmailTemplate) => {
    const newStep: EmailSequenceStep = {
      ...defaultEmailStep,
      id: `step-${Date.now()}`,
      name: template ? template.name : `Email ${emailSequence.length + 1}`,
      subject: template ? template.subject : '',
      content: template ? template.content : '',
      template: template?.id,
    };
    
    onSequenceChange([...emailSequence, newStep]);
    setExpandedSteps(prev => new Set([...prev, newStep.id]));
  };

  const updateEmailStep = (stepId: string, updates: Partial<EmailSequenceStep>) => {
    const updatedSequence = emailSequence.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );
    onSequenceChange(updatedSequence);
  };

  const removeEmailStep = (stepId: string) => {
    const updatedSequence = emailSequence.filter(step => step.id !== stepId);
    onSequenceChange(updatedSequence);
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
    setShowDeleteDialog(false);
    setStepToDelete(null);
  };

  const confirmDeleteStep = (stepId: string) => {
    setStepToDelete(stepId);
    setShowDeleteDialog(true);
  };

  const moveEmailStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = emailSequence.findIndex(step => step.id === stepId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= emailSequence.length) return;

    const newSequence = [...emailSequence];
    [newSequence[currentIndex], newSequence[newIndex]] = [newSequence[newIndex], newSequence[currentIndex]];
    onSequenceChange(newSequence);
  };

  const duplicateEmailStep = (stepId: string) => {
    const stepToDuplicate = emailSequence.find(step => step.id === stepId);
    if (!stepToDuplicate) return;

    const duplicatedStep: EmailSequenceStep = {
      ...stepToDuplicate,
      id: `step-${Date.now()}`,
      name: `${stepToDuplicate.name} (Copy)`,
    };

    const stepIndex = emailSequence.findIndex(step => step.id === stepId);
    const newSequence = [...emailSequence];
    newSequence.splice(stepIndex + 1, 0, duplicatedStep);
    onSequenceChange(newSequence);
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const getStepDelay = (step: EmailSequenceStep, index: number) => {
    if (index === 0) return 'Immediately';
    const totalHours = step.delayDays * 24 + step.delayHours;
    if (totalHours === 0) return 'Immediately';
    if (totalHours < 24) return `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
    if (step.delayHours === 0) return `${step.delayDays} day${step.delayDays !== 1 ? 's' : ''}`;
    return `${step.delayDays} day${step.delayDays !== 1 ? 's' : ''} ${step.delayHours} hour${step.delayHours !== 1 ? 's' : ''}`;
  };

  const applyDelayPreset = (stepId: string, preset: typeof DELAY_PRESETS[0]) => {
    updateEmailStep(stepId, { delayDays: preset.days, delayHours: preset.hours });
  };

  const previewEmail = (step: EmailSequenceStep) => {
    setPreviewStep(step);
    setShowPreviewDialog(true);
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

  const stepToDeleteName = stepToDelete ? emailSequence.find(s => s.id === stepToDelete)?.name : '';

  return (
    <div className={className}>
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Email Sequence Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create a series of automated emails to engage your audience
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Choose Email Template</DialogTitle>
                <DialogDescription>
                  Select a pre-built template to get started quickly
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 mt-4">
                {EMAIL_TEMPLATES.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      addEmailStep(template);
                      setShowTemplateDialog(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <Button size="sm">Use Template</Button>
                      </div>
                      <div className="mt-3 p-3 bg-muted/30 rounded text-sm">
                        <div className="font-medium text-xs text-muted-foreground mb-1">Subject:</div>
                        <div className="truncate">{template.subject}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => addEmailStep()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Email
          </Button>
        </div>
      </div>

      {/* Sequence Overview */}
      {emailSequence.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{emailSequence.length}</div>
                  <div className="text-xs text-muted-foreground">Total Emails</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {emailSequence.filter(s => s.isActive).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{getTotalSequenceDuration()}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Sequence
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Steps */}
      {emailSequence.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">No emails in sequence</h4>
            <p className="text-muted-foreground mb-4">
              Start building your email sequence by adding your first email
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button onClick={() => addEmailStep()}>
                <Plus className="h-4 w-4 mr-2" />
                Create from Scratch
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {emailSequence.map((step, index) => {
            const isExpanded = expandedSteps.has(step.id);
            
            return (
              <Card key={step.id} className={`transition-all ${!step.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Drag Handle & Move Controls */}
                      <div className="flex flex-col items-center space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveEmailStep(step.id, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveEmailStep(step.id, 'down')}
                          disabled={index === emailSequence.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Step Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Step {index + 1}
                          </Badge>
                          {step.template && (
                            <Badge variant="secondary" className="text-xs">
                              Template
                            </Badge>
                          )}
                          {!step.isActive && (
                            <Badge variant="destructive" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium">{step.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Send {getStepDelay(step, index)} after {index === 0 ? 'campaign start' : 'previous email'}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={step.isActive}
                        onCheckedChange={(checked) => updateEmailStep(step.id, { isActive: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStepExpanded(step.id)}
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewEmail(step)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateEmailStep(step.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => confirmDeleteStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <Separator />
                    
                    {/* Basic Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Name</Label>
                        <Input
                          value={step.name}
                          onChange={(e) => updateEmailStep(step.id, { name: e.target.value })}
                          placeholder="Email name"
                        />
                      </div>
                      
                      {index > 0 && (
                        <div className="space-y-2">
                          <Label>Delay</Label>
                          <Select onValueChange={(value) => {
                            const preset = DELAY_PRESETS.find(p => p.label === value);
                            if (preset) applyDelayPreset(step.id, preset);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delay..." />
                            </SelectTrigger>
                            <SelectContent>
                              {DELAY_PRESETS.map(preset => (
                                <SelectItem key={preset.label} value={preset.label}>
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Custom Delay Settings */}
                    {index > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Days</Label>
                          <Input
                            type="number"
                            min="0"
                            max="365"
                            value={step.delayDays}
                            onChange={(e) => updateEmailStep(step.id, { delayDays: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hours</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={step.delayHours}
                            onChange={(e) => updateEmailStep(step.id, { delayHours: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Email Content */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input
                          value={step.subject}
                          onChange={(e) => updateEmailStep(step.id, { subject: e.target.value })}
                          placeholder="Enter email subject..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email Content</Label>
                        <Textarea
                          value={step.content}
                          onChange={(e) => updateEmailStep(step.id, { content: e.target.value })}
                          placeholder="Write your email content here..."
                          rows={6}
                          className="resize-none"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => previewEmail(step)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Personalize
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Advanced
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Email Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look to recipients
            </DialogDescription>
          </DialogHeader>
          {previewStep && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-background">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject:</span>
                    <span className="font-medium">{previewStep.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From:</span>
                    <span>your-email@company.com</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/20 min-h-[200px]">
                <div className="whitespace-pre-wrap text-sm">
                  {previewStep.content || 'No content added yet...'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Step</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{stepToDeleteName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => stepToDelete && removeEmailStep(stepToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 