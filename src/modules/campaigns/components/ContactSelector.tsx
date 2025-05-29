"use client";

import React, { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Users,
  Building,
  Mail,
  Phone,
  Tag,
  CheckCircle,
  Circle,
  Filter,
  List,
  User
} from 'lucide-react';
import { Contact, ContactSelectorProps } from '../types';

// Import common tags from CRM module
const COMMON_TAGS = [
  'VIP', 'Enterprise', 'SMB', 'Startup', 'Technology', 'Healthcare', 
  'Finance', 'Education', 'Government', 'Non-profit', 'Hot-lead', 
  'Cold-lead', 'Warm-lead', 'Decision-maker', 'Influencer', 'Champion'
];

interface CategorySelection {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  isSelected: boolean;
}

interface ContactSelectorState {
  selectedPeople: string[];
  selectedCategories: string[];
}

export function ContactSelector({ 
  open, 
  onOpenChange, 
  selectedContacts, 
  onContactsChange,
  // New props for providing actual data
  contacts = [],
  onLoadContacts,
  onLoadContactsByTag
}: ContactSelectorProps & {
  contacts?: Contact[];
  onLoadContacts?: () => Promise<Contact[]>;
  onLoadContactsByTag?: (tag: string) => Promise<Contact[]>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'people' | 'categories'>('people');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    return COMMON_TAGS.filter(tag =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(tag => ({
      id: tag.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: tag,
      description: `All contacts tagged with "${tag}"`,
      contactCount: contacts.filter(contact => contact.tags?.includes(tag)).length,
      isSelected: selectedCategories.includes(tag)
    }));
  }, [searchQuery, selectedCategories, contacts]);

  const handlePersonToggle = (contactId: string) => {
    const newSelectedContacts = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    onContactsChange(newSelectedContacts);
  };

  const handleCategoryToggle = async (categoryName: string) => {
    const isSelected = selectedCategories.includes(categoryName);
    
    if (isSelected) {
      // Remove category and its contacts
      setSelectedCategories(prev => prev.filter(cat => cat !== categoryName));
      
      // Remove contacts with this tag
      const contactsWithTag = contacts
        .filter(contact => contact.tags?.includes(categoryName))
        .map(contact => contact.id);
      
      const newSelectedContacts = selectedContacts.filter(id => !contactsWithTag.includes(id));
      onContactsChange(newSelectedContacts);
    } else {
      // Add category and its contacts
      setSelectedCategories(prev => [...prev, categoryName]);
      
      try {
        setIsLoading(true);
        
        // Get contacts for this category
        const categoryContacts = onLoadContactsByTag 
          ? await onLoadContactsByTag(categoryName)
          : contacts.filter(contact => contact.tags?.includes(categoryName));
        
        const categoryContactIds = categoryContacts.map(contact => contact.id);
        const newSelectedContacts = [...new Set([...selectedContacts, ...categoryContactIds])];
        onContactsChange(newSelectedContacts);
      } catch (error) {
        console.error('Error loading contacts for category:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectAll = async () => {
    try {
      setIsLoading(true);
      
      if (selectedTab === 'people') {
        // Load all contacts if needed
        const allContacts = onLoadContacts ? await onLoadContacts() : contacts;
        const allContactIds = allContacts.map(c => c.id);
        const newSelectedContacts = [...new Set([...selectedContacts, ...allContactIds])];
        onContactsChange(newSelectedContacts);
      } else {
        // Select all categories
        const allCategoryNames = filteredCategories.map(cat => cat.name);
        setSelectedCategories(prev => [...new Set([...prev, ...allCategoryNames])]);
        
        // Get all contacts from all categories
        const allCategoryContacts = contacts.filter(contact => 
          contact.tags?.some(tag => allCategoryNames.includes(tag))
        );
        const allContactIds = allCategoryContacts.map(contact => contact.id);
        const newSelectedContacts = [...new Set([...selectedContacts, ...allContactIds])];
        onContactsChange(newSelectedContacts);
      }
    } catch (error) {
      console.error('Error selecting all:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    onContactsChange([]);
    setSelectedCategories([]);
  };

  const getSelectedContactsInfo = () => {
    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    return {
      count: selectedContacts.length,
      contacts: selectedContactsData
    };
  };

  const selectedInfo = getSelectedContactsInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Campaign Audience</DialogTitle>
          <DialogDescription>
            Choose individual people or categories of contacts for your campaign
          </DialogDescription>
        </DialogHeader>

        {/* Search and Actions */}
        <div className="flex flex-col space-y-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people, companies, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              disabled={isLoading}
            >
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>

          {/* Selection Summary */}
          {selectedInfo.count > 0 && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">
                      {selectedInfo.count} contact{selectedInfo.count !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-md">
                    {selectedInfo.contacts.slice(0, 3).map(contact => (
                      <Badge key={contact.id} variant="secondary" className="text-xs">
                        {contact.name}
                      </Badge>
                    ))}
                    {selectedInfo.count > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedInfo.count - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Selection Summary */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Selected categories:</span>
              {selectedCategories.map(category => (
                <Badge key={category} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="people" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>People</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>Categories</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="flex-1 min-h-0 mt-4">
            <div className="h-full overflow-y-auto pr-2 space-y-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search query' : 'No contacts available to select'}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedContacts.includes(contact.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : ''
                    }`}
                    onClick={() => handlePersonToggle(contact.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => handlePersonToggle(contact.id)}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&size=64&background=3B82F6&color=fff&bold=true&format=png`}
                            alt={contact.name}
                          />
                          <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{contact.name}</h4>
                            <div className="flex flex-wrap gap-1">
                              {contact.tags?.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                            {contact.company && (
                              <div className="flex items-center space-x-2">
                                <Building className="h-3 w-3" />
                                <span className="truncate">{contact.title} at {contact.company}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="flex-1 min-h-0 mt-4">
            <div className="h-full overflow-y-auto pr-2 space-y-3">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search query' : 'No categories available'}
                  </p>
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <Card
                    key={category.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedCategories.includes(category.name) ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : ''
                    }`}
                    onClick={() => handleCategoryToggle(category.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          checked={selectedCategories.includes(category.name)}
                          onChange={() => handleCategoryToggle(category.name)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">{category.name}</h4>
                            </div>
                            <Badge variant="secondary">
                              {category.contactCount} contact{category.contactCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          
                          {/* Show preview of contacts in this category */}
                          {category.contactCount > 0 && (
                            <div className="flex items-center space-x-2 mt-3">
                              <div className="flex -space-x-2">
                                {contacts
                                  .filter(contact => contact.tags?.includes(category.name))
                                  .slice(0, 3)
                                  .map(contact => (
                                    <Avatar key={contact.id} className="h-6 w-6 border-2 border-background">
                                      <AvatarImage
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&size=32&background=3B82F6&color=fff&bold=true&format=png`}
                                        alt={contact.name}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {contact.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                {category.contactCount > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                                    +{category.contactCount - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {selectedInfo.count} contact{selectedInfo.count !== 1 ? 's' : ''} selected
            {selectedCategories.length > 0 && (
              <span className="ml-2">
                from {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Add Selected Contacts'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 