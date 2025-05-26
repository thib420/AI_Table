"use client";

import React, { useState } from 'react';
import { useMailbox } from './MailboxPage/useMailbox';
import { MailboxSidebar } from './MailboxPage/MailboxSidebar';
import { MailboxList } from './MailboxPage/MailboxList';
import { MailboxDetail } from './MailboxPage/MailboxDetail';
import { useMicrosoftAuth } from '../services/MicrosoftAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Wifi, WifiOff, Mail, LogOut, AlertCircle, Settings } from 'lucide-react';

interface MailboxPageProps {
  onCustomerView?: (customerId: string) => void;
  onNavigateToCRM?: () => void;
}

export function MailboxPage({ onCustomerView, onNavigateToCRM }: MailboxPageProps = {}) {
  const { isSignedIn, isLoading: authLoading, signIn, signOut, userProfile } = useMicrosoftAuth();
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const {
    emails,
    allEmails,
    selectedEmail,
    setSelectedEmail,
    searchQuery,
    setSearchQuery,
    currentView,
    setCurrentView,
    isLoading,
    error,
    isConnected,
    refreshEmails,
    toggleStar,
  } = useMailbox();

  // Helper for viewing CRM - navigates to CRM module
  const handleViewCRM = () => {
    console.log('📧 handleViewCRM called - navigating to CRM');
    if (onNavigateToCRM) {
      onNavigateToCRM();
    } else {
      // Fallback: navigate to CRM page directly
      window.location.href = '/?view=crm';
    }
  };

  // Helper for customer 360 from detail
  const handleViewCustomer = (email: string) => {
    if (onCustomerView) {
      onCustomerView(email);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      // Check if it's a client ID issue
      if (error instanceof Error && error.message.includes('client_id')) {
        setShowSetupHelp(true);
      }
    }
  };

  const handleMicrosoftSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Check if Microsoft Client ID is configured
  const microsoftClientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
  const isMicrosoftConfigured = microsoftClientId && microsoftClientId !== 'your_microsoft_client_id_here';

  // Show connection prompt if not connected and not using demo mode
  if (!isSignedIn && !authLoading && !useDemoMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">Mailbox</h2>
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Demo Mode
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Connect to Microsoft Outlook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isMicrosoftConfigured ? (
                <>
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <Settings className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Setup Required:</strong> Microsoft Graph integration is not configured. 
                      <button 
                        onClick={() => setShowSetupHelp(!showSetupHelp)}
                        className="text-blue-600 hover:underline ml-1"
                      >
                        Click here for setup instructions.
                      </button>
                    </AlertDescription>
                  </Alert>
                  
                  {showSetupHelp && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs space-y-2">
                        <div><strong>To connect real emails:</strong></div>
                        <div>1. Create a <code>.env.local</code> file in your project root</div>
                        <div>2. Add: <code>NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_client_id</code></div>
                        <div>3. See <code>MICROSOFT_SETUP.md</code> for detailed Azure setup</div>
                        <div>4. Restart your development server</div>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Connect your Microsoft account to access your real emails, or continue with demo data.
                </p>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={handleMicrosoftSignIn} 
                  className="w-full" 
                  size="lg"
                  disabled={!isMicrosoftConfigured}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isMicrosoftConfigured ? 'Connect Microsoft Account' : 'Setup Required'}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                
                <Button variant="outline" onClick={() => setUseDemoMode(true)} className="w-full">
                  Continue with Demo Data
                </Button>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  You&apos;re currently viewing demo emails. {isMicrosoftConfigured ? 'Connect your Microsoft account to access real email data.' : 'Complete the setup to connect real emails.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Mailbox</h2>
            {isConnected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Demo Mode
              </Badge>
            )}
            {userProfile && (
              <span className="text-sm text-muted-foreground">
                {userProfile.displayName || userProfile.mail}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshEmails}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {!isConnected ? (
              <Button variant="outline" size="sm" onClick={handleMicrosoftSignIn}>
                <Mail className="h-4 w-4 mr-2" />
                Connect Microsoft
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleMicrosoftSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert className="mx-6 mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {authLoading || isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">
              {authLoading ? 'Initializing...' : 'Loading emails...'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <MailboxSidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            inboxUnread={allEmails.filter(e => e.folder === 'inbox' && !e.isRead).length}
            starredCount={allEmails.filter(e => e.isStarred).length}
            onViewCRM={handleViewCRM}
          />
          {/* Email List */}
          <div className="flex-1 flex min-h-0">
            <div className="w-1/6 border-r flex flex-col">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-medium text-sm">
                  {currentView === 'inbox' ? 'Inbox' : 
                   currentView === 'starred' ? 'Starred' :
                   currentView === 'sent' ? 'Sent' :
                   currentView === 'drafts' ? 'Drafts' :
                   currentView === 'archive' ? 'Archive' : 'Emails'}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({emails.length})
                  </span>
                </h3>
              </div>
              <MailboxList
                emails={emails}
                selectedEmailId={selectedEmail?.id || null}
                onSelect={setSelectedEmail}
                onToggleStar={toggleStar}
              />
            </div>
            {/* Email Content */}
            <div className="flex-1 flex flex-col">
              <MailboxDetail email={selectedEmail} onViewCustomer={onCustomerView ? handleViewCustomer : undefined} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 