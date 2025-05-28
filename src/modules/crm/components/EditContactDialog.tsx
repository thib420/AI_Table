"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Briefcase, 
  Tag, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { Contact } from '../types';
import { graphCRMService } from '../services/GraphCRMService';
import { generateProfilePicture } from '../utils/helpers';

interface EditContactDialogProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContact: Contact) => void;
}

// Define customizable contact types and their metadata
export const CONTACT_TYPES = [
  { value: 'lead', label: 'Lead', description: 'Initial prospect or potential customer' },
  { value: 'prospect', label: 'Prospect', description: 'Qualified lead in active consideration' },
  { value: 'customer', label: 'Customer', description: 'Active paying customer' },
  { value: 'partner', label: 'Partner', description: 'Business partner or collaborator' },
  { value: 'vendor', label: 'Vendor', description: 'Service or product provider' },
  { value: 'investor', label: 'Investor', description: 'Financial backer or investor' },
  { value: 'employee', label: 'Employee', description: 'Current team member' },
  { value: 'contractor', label: 'Contractor', description: 'Freelancer or contractor' },
  { value: 'intern', label: 'Intern', description: 'Internship participant' },
  { value: 'inactive', label: 'Inactive', description: 'No longer active contact' }
] as const;

// Common tags for quick selection
const COMMON_TAGS = [
  'VIP', 'Enterprise', 'SMB', 'Startup', 'Technology', 'Healthcare', 
  'Finance', 'Education', 'Government', 'Non-profit', 'Hot-lead', 
  'Cold-lead', 'Warm-lead', 'Decision-maker', 'Influencer', 'Champion'
];

export function EditContactDialog({ contact, isOpen, onClose, onSave }: EditContactDialogProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGraphSyncEnabled, setIsGraphSyncEnabled] = useState(true);

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        position: contact.position,
        location: contact.location,
        status: contact.status,
        dealValue: contact.dealValue,
        tags: contact.tags,
        source: contact.source
      });
      setCustomTags(contact.tags || []);
    }
  }, [contact]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({});
      setCustomTags([]);
      setNewTag('');
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof Contact, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !customTags.includes(tag)) {
      const updatedTags = [...customTags, tag];
      setCustomTags(updatedTags);
      setFormData(prev => ({
        ...prev,
        tags: updatedTags
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = customTags.filter(tag => tag !== tagToRemove);
    setCustomTags(updatedTags);
    setFormData(prev => ({
      ...prev,
      tags: updatedTags
    }));
  };

  const handleSave = async () => {
    if (!contact || !formData.name || !formData.email) {
      setError('Name and email are required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedContactData: Partial<Contact> = {
        ...formData,
        tags: customTags,
        lastContact: new Date().toISOString().split('T')[0]
      };

      // Update contact in CRM service (this handles Microsoft Graph sync)
      const updatedContact = await graphCRMService.updateContact(contact.id, updatedContactData);
      
      console.log('✅ Contact updated successfully:', updatedContact);
      onSave(updatedContact);
      onClose();
    } catch (err) {
      console.error('❌ Error updating contact:', err);
      if (err instanceof Error) {
        setError(`Failed to update contact: ${err.message}`);
      } else {
        setError('Failed to update contact. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!contact) return null;

  const selectedContactType = CONTACT_TYPES.find(type => type.value === formData.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={generateProfilePicture(formData.name || contact.name)} alt={formData.name || contact.name} />
              <AvatarFallback>
                {(formData.name || contact.name).split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>Edit Contact</span>
              <p className="text-sm text-muted-foreground font-normal">
                Update contact information and sync with Microsoft Graph
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  Company
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Company name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">
                  Position / Job Title
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="position"
                    value={formData.position || ''}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Job title"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, Country"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Type and Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Contact Type & Business</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Contact Type *
                </Label>
                <Select
                  value={formData.status || ''}
                  onValueChange={(value: string) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedContactType && (
                  <p className="text-xs text-muted-foreground">
                    {selectedContactType.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dealValue">
                  Deal Value ($)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dealValue"
                    type="number"
                    min="0"
                    value={formData.dealValue || 0}
                    onChange={(e) => handleInputChange('dealValue', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tags</h3>
            
            {/* Existing Tags */}
            {customTags.length > 0 && (
              <div className="space-y-2">
                <Label>Current Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Common Tags */}
            <div className="space-y-2">
              <Label>Quick Tags - (Categories in Outlook)</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.filter(tag => !customTags.includes(tag)).map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTag(tag)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="space-y-2">
              <Label htmlFor="newTag">Add Custom Tag</Label>
              <div className="flex space-x-2">
                <Input
                  id="newTag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter custom tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTag);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddTag(newTag)}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Source Information */}
          <div className="space-y-2">
            <Label>Source</Label>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Originally from: {contact.source}</span>
              {isGraphSyncEnabled && (
                <Badge variant="outline" className="text-xs">
                  Microsoft Graph Sync Enabled
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !formData.name || !formData.email}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 