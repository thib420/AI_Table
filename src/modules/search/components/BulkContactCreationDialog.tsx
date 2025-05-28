"use client";

import React, { useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Building2,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Tag
} from 'lucide-react';
import { EnrichedExaResultItem } from '../services/ai-column-generator';
import { Contact } from '@/modules/crm/types';
import { CONTACT_TYPES } from '@/modules/crm/components/EditContactDialog';
import { graphCRMService } from '@/modules/crm/services/GraphCRMService';
import { generateProfilePicture } from '@/modules/crm/utils/helpers';

interface BulkContactCreationDialogProps {
  selectedResults: EnrichedExaResultItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdContacts: Contact[]) => void;
}

interface ContactCreationStatus {
  resultIndex: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  contact?: Contact;
  error?: string;
}

interface ProcessingData {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  source: string;
  url: string;
}

export function BulkContactCreationDialog({ 
  selectedResults, 
  isOpen, 
  onClose, 
  onSuccess 
}: BulkContactCreationDialogProps) {
  const [defaultContactType, setDefaultContactType] = useState<string>('prospect');
  const [defaultTags, setDefaultTags] = useState<string[]>(['LinkedIn', 'Bulk Import']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatuses, setProcessingStatuses] = useState<ContactCreationStatus[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [includeCheckedResults, setIncludeCheckedResults] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize inclusion states when dialog opens
  React.useEffect(() => {
    if (isOpen && selectedResults.length > 0) {
      setIncludeCheckedResults(new Array(selectedResults.length).fill(true));
      setProcessingStatuses(selectedResults.map((_, index) => ({
        resultIndex: index,
        status: 'pending'
      })));
      setProcessedCount(0);
      setError(null);
    }
  }, [isOpen, selectedResults]);

  // Extract contact data from search result
  const extractContactData = useCallback((result: EnrichedExaResultItem): ProcessingData => {
    // Extract email from the LinkedIn URL pattern or text content
    const extractEmail = (result: EnrichedExaResultItem): string => {
      // First check if email is already in a column
      if ((result as any).email) return (result as any).email;
      
      // Try to extract from LinkedIn URL pattern
      const urlMatch = result.url.match(/linkedin\.com\/in\/([^\/]+)/);
      if (urlMatch) {
        const username = urlMatch[1].replace(/-/g, '.');
        return `${username}@company.com`; // Placeholder email pattern
      }
      
      // Try to extract from text content
      const emailMatch = result.text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      if (emailMatch) return emailMatch[0];
      
      return '';
    };

    // Extract phone from text content or AI columns
    const extractPhone = (result: EnrichedExaResultItem): string => {
      if ((result as any).phone) return (result as any).phone;
      
      const phoneMatch = result.text.match(/\+?[\d\s\-\(\)]{10,}/);
      return phoneMatch ? phoneMatch[0] : '';
    };

    // Extract company from AI columns or profile content
    const extractCompany = (result: EnrichedExaResultItem): string => {
      if ((result as any).company) return (result as any).company;
      if ((result as any).ai_company) return (result as any).ai_company;
      
      // Extract from title or text
      const titleMatch = result.title.match(/at (.+)/i);
      if (titleMatch) return titleMatch[1];
      
      return '';
    };

    // Extract position/title
    const extractPosition = (result: EnrichedExaResultItem): string => {
      if ((result as any).position) return (result as any).position;
      if ((result as any).ai_position || (result as any).ai_seniority_level) {
        return (result as any).ai_position || (result as any).ai_seniority_level;
      }
      
      // Extract from title before " at "
      const titleMatch = result.title.match(/^(.+?)\s+at\s+/i);
      return titleMatch ? titleMatch[1] : result.title;
    };

    // Extract location
    const extractLocation = (result: EnrichedExaResultItem): string => {
      if ((result as any).location) return (result as any).location;
      if ((result as any).ai_location) return (result as any).ai_location;
      
      // Try to extract from text
      const locationMatch = result.text.match(/\b([A-Z][a-z]+,?\s*[A-Z]{2,})\b/);
      return locationMatch ? locationMatch[1] : '';
    };

    return {
      name: result.author || 'Unknown',
      email: extractEmail(result),
      phone: extractPhone(result),
      company: extractCompany(result),
      position: extractPosition(result),
      location: extractLocation(result),
      source: 'LinkedIn Search',
      url: result.url
    };
  }, []);

  // Handle bulk creation process
  const handleBulkCreate = async () => {
    const resultsToProcess = selectedResults.filter((_, index) => includeCheckedResults[index]);
    
    if (resultsToProcess.length === 0) {
      setError('Please select at least one contact to create');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    const createdContacts: Contact[] = [];
    const updatedStatuses = [...processingStatuses];

    try {
      for (let i = 0; i < resultsToProcess.length; i++) {
        const resultIndex = selectedResults.findIndex(r => r === resultsToProcess[i]);
        const result = resultsToProcess[i];
        
        // Update status to processing
        updatedStatuses[resultIndex] = { ...updatedStatuses[resultIndex], status: 'processing' };
        setProcessingStatuses([...updatedStatuses]);

        try {
          const contactData = extractContactData(result);
          
          // Validate required fields
          if (!contactData.name || !contactData.email) {
            throw new Error('Name and email are required');
          }

          // Create contact via GraphCRMService
          const newContact = await graphCRMService.createContact({
            name: contactData.name,
            email: contactData.email,
            phone: contactData.phone,
            company: contactData.company,
            position: contactData.position,
            location: contactData.location,
            status: defaultContactType as Contact['status'],
            dealValue: 0,
            tags: [...defaultTags, ...(contactData.company ? [contactData.company] : [])],
            source: contactData.source,
            lastContact: new Date().toISOString().split('T')[0]
          });

          // Update status to success
          updatedStatuses[resultIndex] = { 
            ...updatedStatuses[resultIndex], 
            status: 'success', 
            contact: newContact 
          };
          createdContacts.push(newContact);

        } catch (contactError) {
          console.error(`Error creating contact for ${result.author}:`, contactError);
          updatedStatuses[resultIndex] = { 
            ...updatedStatuses[resultIndex], 
            status: 'error',
            error: contactError instanceof Error ? contactError.message : 'Unknown error'
          };
        }

        setProcessingStatuses([...updatedStatuses]);
        setProcessedCount(i + 1);

        // Add delay to avoid rate limiting
        if (i < resultsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ Bulk contact creation completed: ${createdContacts.length}/${resultsToProcess.length} successful`);
      
      if (createdContacts.length > 0) {
        onSuccess(createdContacts);
      }

      // Auto-close after 2 seconds if all successful
      if (createdContacts.length === resultsToProcess.length) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Bulk creation failed:', error);
      setError(error instanceof Error ? error.message : 'Bulk creation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleInclude = (index: number, checked: boolean) => {
    const newIncludeStates = [...includeCheckedResults];
    newIncludeStates[index] = checked;
    setIncludeCheckedResults(newIncludeStates);
  };

  const handleSelectAll = (checked: boolean) => {
    setIncludeCheckedResults(new Array(selectedResults.length).fill(checked));
  };

  const selectedCount = includeCheckedResults.filter(Boolean).length;
  const successCount = processingStatuses.filter(s => s.status === 'success').length;
  const errorCount = processingStatuses.filter(s => s.status === 'error').length;
  const progressPercent = selectedResults.length > 0 ? (processedCount / selectedCount) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Users className="h-6 w-6" />
            <div>
              <span>Bulk Create Contacts</span>
              <p className="text-sm text-muted-foreground font-normal">
                Create multiple contacts and sync with Microsoft Graph
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
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-type">Default Contact Type</Label>
              <Select value={defaultContactType} onValueChange={setDefaultContactType}>
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
            </div>

            <div className="space-y-2">
              <Label>Summary</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedResults.length} profiles found</Badge>
                <Badge variant="secondary">{selectedCount} selected</Badge>
                {isProcessing && (
                  <>
                    <Badge variant="default">{successCount} created</Badge>
                    {errorCount > 0 && <Badge variant="destructive">{errorCount} failed</Badge>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creating contacts...</span>
                <span>{processedCount}/{selectedCount}</span>
              </div>
              <Progress value={progressPercent} className="w-full" />
            </div>
          )}

          {/* Contact List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Contacts to Create</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedCount === selectedResults.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Select All</Label>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 border rounded-md p-4">
              {selectedResults.map((result, index) => {
                const contactData = extractContactData(result);
                const status = processingStatuses[index];
                const isIncluded = includeCheckedResults[index];

                return (
                  <div 
                    key={index}
                    className={`flex items-center space-x-4 p-3 rounded-lg border ${
                      !isIncluded ? 'opacity-50 bg-muted/30' : 'bg-background'
                    } ${
                      status?.status === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' :
                      status?.status === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' :
                      status?.status === 'processing' ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950' :
                      'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={isIncluded}
                      onCheckedChange={(checked) => handleToggleInclude(index, checked as boolean)}
                      disabled={isProcessing}
                    />

                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={generateProfilePicture(contactData.name)} 
                        alt={contactData.name} 
                      />
                      <AvatarFallback>
                        {contactData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium truncate">{contactData.name}</h4>
                        {status?.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {status?.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {status?.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1 text-xs text-muted-foreground">
                        {contactData.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contactData.email}</span>
                          </div>
                        )}
                        {contactData.company && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{contactData.company}</span>
                          </div>
                        )}
                        {contactData.position && (
                          <div className="flex items-center space-x-1">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{contactData.position}</span>
                          </div>
                        )}
                        {contactData.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{contactData.location}</span>
                          </div>
                        )}
                      </div>

                      {status?.error && (
                        <div className="mt-1 text-xs text-red-600">
                          Error: {status.error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Default Tags */}
          <div className="space-y-2">
            <Label>Default Tags (will be applied to all contacts)</Label>
            <div className="flex flex-wrap gap-2">
              {defaultTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => setDefaultTags(defaultTags.filter((_, i) => i !== index))}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isProcessing 
              ? `Processing ${processedCount}/${selectedCount} contacts...`
              : `Ready to create ${selectedCount} contact${selectedCount !== 1 ? 's' : ''}`
            }
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleBulkCreate} 
              disabled={isProcessing || selectedCount === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${selectedCount} Contact${selectedCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 