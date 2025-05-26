"use client";

import React, { useState, useEffect } from 'react';
import { CustomerProfile, CustomerInteraction } from '../types';
import { customer360Service } from '../services/Customer360Service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMicrosoftAuth } from '@/modules/mailbox/services/MicrosoftAuthContext';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Clock, 
  Star,
  Phone,
  MapPin,
  Building,
  User,
  Activity,
  MessageSquare,
  Video,
  Paperclip,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Customer360ViewProps {
  customerEmail: string;
  onBack: () => void;
}

export function Customer360View({ customerEmail, onBack }: Customer360ViewProps) {
  const { isSignedIn } = useMicrosoftAuth();
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎯 Customer360View: Component mounted with email:', customerEmail);
    console.log('🎯 Customer360View: isSignedIn:', isSignedIn);
    loadCustomerProfile();
  }, [customerEmail]);

  const loadCustomerProfile = async () => {
    try {
      console.log('🎯 Customer360View: Starting to load profile for:', customerEmail);
      setIsLoading(true);
      setError(null);
      const profile = await customer360Service.getCustomerProfile(customerEmail);
      console.log('🎯 Customer360View: Profile loaded:', profile);
      setCustomerProfile(profile);
    } catch (err) {
      console.error('🎯 Customer360View: Error loading customer profile:', err);
      setError('Failed to load customer profile');
    } finally {
      console.log('🎯 Customer360View: Loading finished');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !customerProfile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{error || 'Customer profile not found'}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mailbox
          </Button>
        </div>
      </div>
    );
  }

  const { contact, emails, meetings, documents, stats, timeline } = customerProfile;

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getImportanceBadge = (importance: string) => {
    const variants = {
      high: 'destructive',
      normal: 'secondary',
      low: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[importance as keyof typeof variants] || 'secondary'}>
        {importance}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h2 className="text-lg font-semibold">Customer 360</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Authentication Status Alert */}
        {!isSignedIn && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <strong>Limited Data Available:</strong> You're viewing data in demo mode. 
              Connect to Microsoft Graph in the Mailbox to access real email data and enhanced customer insights.
            </AlertDescription>
          </Alert>
        )}

        {/* Data Status Alert */}
        {isSignedIn && customerProfile && customerProfile.emails.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No email interactions found with {customerEmail}. This could mean:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>No emails have been exchanged with this contact</li>
                <li>The email address might be slightly different</li>
                <li>Emails might be in a different folder or archived</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Customer Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback className="text-lg">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <h1 className="text-2xl font-bold">{contact.name}</h1>
                    <p className="text-muted-foreground">{contact.position}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{contact.company}</span>
                    </div>
                    {contact.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{contact.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={contact.status === 'customer' ? 'default' : 'secondary'}>
                      {contact.status}
                    </Badge>
                    {contact.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  ${contact.dealValue.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Deal Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalEmails}</p>
                    <p className="text-sm text-muted-foreground">Emails</p>
                  </div>
                </div>
                {isSignedIn ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-600" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalMeetings}</p>
                  <p className="text-sm text-muted-foreground">Meetings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-lg font-bold">{stats.responseTime}</p>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.engagementScore}</p>
                  <p className="text-sm text-muted-foreground">Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="emails">Emails ({emails.length})</TabsTrigger>
            <TabsTrigger value="meetings">Meetings ({meetings.length})</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Interaction Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.slice(0, 20).map((interaction) => (
                    <div key={interaction.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0 mt-1">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{interaction.title}</h4>
                          <div className="flex items-center space-x-2">
                            {getImportanceBadge(interaction.importance)}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(interaction.date)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {interaction.description}
                        </p>
                        {interaction.direction && (
                          <Badge variant="outline" className="mt-2">
                            {interaction.direction}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div key={email.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{email.subject}</h4>
                        <div className="flex items-center space-x-2">
                          {email.hasAttachments && <Paperclip className="h-4 w-4" />}
                          {getImportanceBadge(email.importance)}
                          <Badge variant={email.direction === 'inbound' ? 'default' : 'secondary'}>
                            {email.direction}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{email.preview}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>From: {email.sender}</span>
                        <span>{formatDate(email.receivedDateTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meeting History</CardTitle>
              </CardHeader>
              <CardContent>
                {meetings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No meetings found. Meeting data will be available when calendar integration is enabled.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {meetings.map((meeting) => (
                      <div key={meeting.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{meeting.subject}</h4>
                          <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{formatDate(meeting.start)} - {formatDate(meeting.end)}</p>
                          {meeting.location && <p>Location: {meeting.location}</p>}
                          <p>Attendees: {meeting.attendees.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shared Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No shared documents found. Document data will be available when OneDrive/SharePoint integration is enabled.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => (
                      <div key={document.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{document.name}</h4>
                          <Badge variant="outline">{document.type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Shared by: {document.sharedBy}</p>
                          <p>Last modified: {formatDate(document.lastModified)}</p>
                          <p>Size: {(document.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 