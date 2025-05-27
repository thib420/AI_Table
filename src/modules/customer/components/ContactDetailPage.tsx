"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  FileText, 
  ShoppingCart, 
  Target, 
  MessageSquare, 
  Activity, 
  Edit, 
  Star, 
  ExternalLink,
  Download,
  Send,
  Clock,
  DollarSign,
  Paperclip,
  Video,
  Users,
  TrendingUp,
  Eye,
  MoreHorizontal,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { graphCRMService } from '@/modules/crm/services/GraphCRMService';
import { customer360Service } from '@/modules/crm/services/Customer360Service';
import { Contact } from '@/modules/crm/types';
import { CustomerProfile, CustomerInteraction } from '@/modules/crm/types';

interface ContactDetailPageProps {
  contactId: string;
  onBack: () => void;
}

export function ContactDetailPage({ contactId, onBack }: ContactDetailPageProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContactData = async () => {
      try {
        console.log(`👤 ContactDetailPage: Loading contact data for: ${contactId}`);
        setLoading(true);
        setError(null);

        // Check if contactId is an email address
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactId);
        
        if (isEmail) {
          console.log(`📧 ContactDetailPage: Detected email address, getting customer profile: ${contactId}`);
          // If it's an email address, go directly to customer profile
          const profile = await customer360Service.getCustomerProfile(contactId);
          if (profile) {
            setCustomerProfile(profile);
            setContact(profile.contact);
            console.log(`✅ ContactDetailPage: Customer profile loaded for email: ${contactId}`);
          } else {
            console.error(`❌ ContactDetailPage: No customer profile found for email: ${contactId}`);
            setError('Customer profile not found');
          }
        } else {
          console.log(`🆔 ContactDetailPage: Detected contact ID, getting contact: ${contactId}`);
          // If it's a contact ID, try to get contact from CRM service first
          const contactData = await graphCRMService.getContact(contactId);
          
          if (contactData) {
            console.log(`✅ ContactDetailPage: Contact found: ${contactData.name}`);
            setContact(contactData);
            
            // Get comprehensive customer profile
            console.log(`📧 ContactDetailPage: Getting customer profile for: ${contactData.email}`);
            const profile = await customer360Service.getCustomerProfile(contactData.email);
            setCustomerProfile(profile);
            console.log(`✅ ContactDetailPage: Customer profile loaded`);
          } else {
            console.error(`❌ ContactDetailPage: No contact found with ID: ${contactId}`);
            setError('Contact not found');
          }
        }
      } catch (err) {
        console.error('❌ ContactDetailPage: Error loading contact data:', err);
        setError('Failed to load contact data');
      } finally {
        setLoading(false);
      }
    };

    loadContactData();
  }, [contactId]);

  const generateProfilePicture = (name: string) => {
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=${backgroundColor}&color=fff&bold=true&format=png`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'call': return Phone;
      case 'meeting': return Video;
      case 'deal': return Target;
      case 'order': return ShoppingCart;
      case 'document': return FileText;
      case 'campaign': return Send;
      case 'note': return MessageSquare;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'call': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'meeting': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'deal': return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
      case 'order': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900';
      case 'document': return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
      case 'campaign': return 'text-pink-600 bg-pink-100 dark:bg-pink-900';
      case 'note': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'prospect': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'customer': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 168) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'meeting': return Calendar;
      case 'document': return ExternalLink;
      default: return Activity;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'meeting': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'document': return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || (!contact && !customerProfile)) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Contact not found'}</p>
          <p className="text-muted-foreground">This contact might not exist or you may not have access to it.</p>
        </div>
      </div>
    );
  }

  const displayContact = contact || (customerProfile ? customerProfile.contact : null);
  
  if (!displayContact) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No contact data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-16 items-center px-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
          
          <div className="flex items-center space-x-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={generateProfilePicture(displayContact.name)} alt={displayContact.name} />
              <AvatarFallback>{displayContact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-xl font-semibold">{displayContact.name}</h1>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-muted-foreground">{displayContact.position} at {displayContact.company}</p>
                <Badge className={getStatusColor(displayContact.status)}>
                  {displayContact.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" className="mr-2">
              <Edit className="h-4 w-4 mr-2" />
              Edit Contact
            </Button>
            <Button variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Add to Favorites
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Unified Dashboard */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Unified Dashboard - All Content in One View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {customerProfile?.interactions && customerProfile.interactions.length > 0 ? (
                  customerProfile.interactions.slice(0, 10).map((interaction: CustomerInteraction) => {
                    const IconComponent = getInteractionIcon(interaction.type);
                    return (
                      <div key={interaction.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className={`p-2 rounded-full ${getInteractionColor(interaction.type)}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{interaction.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {interaction.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(interaction.date)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {interaction.description}
                          </p>
                          {interaction.direction && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {interaction.direction}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No interactions found. Data is automatically gathered from your Microsoft Graph emails and calendar.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Recent Emails ({customerProfile?.emails?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {customerProfile?.emails && customerProfile.emails.length > 0 ? (
                  customerProfile.emails.slice(0, 8).map((email) => (
                    <div key={email.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{email.subject}</h4>
                        <div className="flex items-center space-x-2">
                          {email.hasAttachments && <Paperclip className="h-4 w-4" />}
                          <Badge variant={email.direction === 'inbound' ? 'default' : 'secondary'} className="text-xs">
                            {email.direction}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{email.preview}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>From: {email.sender}</span>
                        <span>{formatTimestamp(email.receivedDateTime)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No emails found. Email data is automatically synchronized from your Microsoft Graph mailbox.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meetings & Calls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Meetings ({customerProfile?.meetings?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {customerProfile?.meetings && customerProfile.meetings.length > 0 ? (
                  customerProfile.meetings.slice(0, 6).map((meeting) => (
                    <div key={meeting.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{meeting.subject}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {meeting.isOnline ? 'Online' : 'In-person'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>📅 {formatTimestamp(meeting.start)}</p>
                        <p>👥 {meeting.attendees.length} attendees</p>
                        {meeting.location && <p>📍 {meeting.location}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No meetings found. Meeting data is automatically synchronized from your Microsoft Graph calendar.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shared Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Shared Documents ({customerProfile?.documents?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {customerProfile?.documents && customerProfile.documents.length > 0 ? (
                  customerProfile.documents.slice(0, 6).map((document) => (
                    <div key={document.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{document.name}</h4>
                        <Badge variant="outline" className="text-xs">{document.type.toUpperCase()}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>👤 Shared by: {document.sharedBy}</p>
                        <p>📅 Modified: {formatTimestamp(document.lastModified)}</p>
                        <p>💾 Size: {document.size}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No shared documents found. Document data would be synchronized from OneDrive/SharePoint.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 