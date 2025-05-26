import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Inbox, Star, Send, Mail, Archive, Calendar, Users, RefreshCw, CheckCircle2 } from 'lucide-react';
import { contactSyncService } from '../../services/ContactSyncService';
import { Email } from './useMailbox';
import { ContactSyncSettingsButton } from '../ContactSyncSettings';

type MailboxView = 'inbox' | 'sent' | 'drafts' | 'archive' | 'starred';

interface MailboxSidebarProps {
  currentView: string;
  setCurrentView: (view: MailboxView) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  inboxUnread: number;
  starredCount: number;
  onViewCRM?: () => void;
  onViewCustomer?: (email: string) => void;
  selectedEmail?: Email | null;
  allEmails?: Email[]; // Add emails for manual sync
}

export function MailboxSidebar({ currentView, setCurrentView, searchQuery, setSearchQuery, inboxUnread, starredCount, onViewCRM, onViewCustomer, selectedEmail, allEmails = [] }: MailboxSidebarProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncStats, setSyncStats] = useState<{ synced: number; skipped: number; errors: number } | null>(null);

  const handleManualSync = async () => {
    if (allEmails.length === 0) return;
    
    setSyncStatus('syncing');
    setSyncStats(null);
    
    try {
      console.log('🔄 Manual contact sync triggered');
      const result = await contactSyncService.syncEmailContactsToCRM(allEmails);
      setSyncStats(result);
      setSyncStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncStats(null);
      }, 3000);
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      setSyncStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  };
  return (
    <div className="w-56 border-r bg-muted/20 flex-shrink-0">
      <div className="p-4 space-y-2">
        {/* Search */}
        <div className="relative mb-4">
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Navigation */}
        <div className="space-y-1">
          <Button
            variant={currentView === 'inbox' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('inbox')}
          >
            <Inbox className="h-4 w-4 mr-3" />
            Inbox
            <span className="ml-auto text-xs">{inboxUnread}</span>
          </Button>
          <Button
            variant={currentView === 'starred' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('starred')}
          >
            <Star className="h-4 w-4 mr-3" />
            Starred
            <span className="ml-auto text-xs">{starredCount}</span>
          </Button>
          <Button
            variant={currentView === 'sent' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('sent')}
          >
            <Send className="h-4 w-4 mr-3" />
            Sent
          </Button>
          <Button
            variant={currentView === 'drafts' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('drafts')}
          >
            <Mail className="h-4 w-4 mr-3" />
            Drafts
          </Button>
          <Button
            variant={currentView === 'archive' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('archive')}
          >
            <Archive className="h-4 w-4 mr-3" />
            Archive
          </Button>
        </div>
        {/* Quick Actions */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium text-muted-foreground px-2">Quick Actions</h4>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start" 
            onClick={() => {
              if (selectedEmail && onViewCustomer) {
                console.log('📧 MailboxSidebar: See in CRM clicked with selected email:', selectedEmail.senderEmail);
                onViewCustomer(selectedEmail.senderEmail);
              } else if (onViewCRM) {
                console.log('📧 MailboxSidebar: No selected email, going to general CRM');
                onViewCRM();
              }
            }}
            disabled={!selectedEmail && !onViewCRM}
          >
            <Users className="h-4 w-4 mr-2" />
            {selectedEmail ? 'See Contact in CRM' : 'Go to CRM'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start" 
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing' || allEmails.length === 0}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : syncStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
                         {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Contacts'}
           </Button>
           <ContactSyncSettingsButton />
           {syncStats && syncStatus === 'success' && (
             <div className="text-xs text-muted-foreground px-2 py-1">
               Added: {syncStats.synced}, Existing: {syncStats.skipped}
               {syncStats.errors > 0 && `, Errors: ${syncStats.errors}`}
             </div>
           )}
           {syncStatus === 'error' && (
             <div className="text-xs text-red-500 px-2 py-1">
               Sync failed. Check rate limits.
             </div>
           )}
        </div>
      </div>
    </div>
  );
} 